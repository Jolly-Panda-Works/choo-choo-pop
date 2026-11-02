package com.jollypanda.choochoopop

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import ir.myket.billingclient.IabHelper
import ir.myket.billingclient.util.Purchase

/**
 * Capacitor bridge for Myket. JS side: src/services/myket.js.
 *
 * Billing (ir.myket:billing): connect({ publicKey }), getSkuDetails({ productIds }), purchase({ productId, payload? }),
 *          consume({ purchaseToken }), getPurchased().
 * Myket's pages: open({ page }).
 * IabHelper runs one operation at a time, so the JS side queues the calls.
 * Every method rejects with a readable message when it fails; purchase also reports `cancelled`.
 */
@CapacitorPlugin(name = "MyketBilling")
class MyketBillingPlugin : Plugin() {
    private var helper: IabHelper? = null

    /** consume needs the Purchase itself, the JS side only has its token. */
    private val purchases = HashMap<String, Purchase>()

    private fun purchaseJson(p: Purchase): JSObject {
        purchases[p.token] = p
        return JSObject().apply {
            put("productId", p.sku)
            put("purchaseToken", p.token)
            put("orderId", p.orderId)
            put("payload", p.developerPayload)
        }
    }

    private fun dispose() {
        try {
            helper?.dispose()
        } catch (e: Exception) {
            // never set up
        }
        helper = null
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        val key = call.getString("publicKey")
        if (key.isNullOrBlank()) return call.reject("publicKey is missing")
        activity.runOnUiThread {
            try {
                dispose()
                val h = IabHelper(context, key)
                helper = h
                h.startSetup { result ->
                    if (result.isSuccess) {
                        call.resolve()
                    } else {
                        if (helper === h) helper = null
                        call.reject(result.message ?: "Myket connection failed")
                    }
                }
            } catch (e: Exception) {
                call.reject(e.message ?: "Myket connection failed")
            }
        }
    }

    @PluginMethod
    fun getSkuDetails(call: PluginCall) {
        val h = helper ?: return call.reject("Not connected to Myket")
        val ids = call.getArray("productIds")?.toList<String>() ?: return call.reject("productIds is missing")
        activity.runOnUiThread {
            try {
                h.queryInventoryAsync(true, ids) { result, inventory ->
                    if (result.isFailure) {
                        call.reject(result.message ?: "Could not read prices")
                    } else {
                        val out = JSArray()
                        ids.mapNotNull { inventory.getSkuDetails(it) }.forEach {
                            out.put(JSObject().apply {
                                put("productId", it.sku)
                                put("price", it.price)
                                put("title", it.title)
                            })
                        }
                        call.resolve(JSObject().apply { put("list", out) })
                    }
                }
            } catch (e: Exception) {
                call.reject(e.message ?: "Could not read prices")
            }
        }
    }

    @PluginMethod
    fun purchase(call: PluginCall) {
        val h = helper ?: return call.reject("Not connected to Myket")
        val productId = call.getString("productId") ?: return call.reject("productId is missing")
        val payload = call.getString("payload") ?: ""
        activity.runOnUiThread {
            try {
                h.launchPurchaseFlow(activity, productId, { result, purchase ->
                    when {
                        result.isSuccess && purchase != null -> call.resolve(purchaseJson(purchase))
                        result.response == IabHelper.IABHELPER_USER_CANCELLED ||
                            result.response == IabHelper.BILLING_RESPONSE_RESULT_USER_CANCELED -> call.reject("cancelled", "CANCELLED")
                        else -> call.reject(result.message ?: "Purchase failed")
                    }
                }, payload)
            } catch (e: Exception) {
                call.reject(e.message ?: "Could not open Myket")
            }
        }
    }

    @PluginMethod
    fun consume(call: PluginCall) {
        val h = helper ?: return call.reject("Not connected to Myket")
        val token = call.getString("purchaseToken") ?: return call.reject("purchaseToken is missing")
        val purchase = purchases[token] ?: return call.reject("Unknown purchase")
        activity.runOnUiThread {
            try {
                h.consumeAsync(purchase) { _, result ->
                    if (result.isSuccess) {
                        purchases.remove(token)
                        call.resolve()
                    } else {
                        call.reject(result.message ?: "Consume failed")
                    }
                }
            } catch (e: Exception) {
                call.reject(e.message ?: "Consume failed")
            }
        }
    }

    /** Purchases Myket still lists as owned: unconsumed coin packs (grant was interrupted) and non-consumables. */
    @PluginMethod
    fun getPurchased(call: PluginCall) {
        val h = helper ?: return call.reject("Not connected to Myket")
        activity.runOnUiThread {
            try {
                h.queryInventoryAsync(false) { result, inventory ->
                    if (result.isFailure) {
                        call.reject(result.message ?: "Query failed")
                    } else {
                        val out = JSArray()
                        inventory.allPurchases.forEach { out.put(purchaseJson(it)) }
                        call.resolve(JSObject().apply { put("list", out) })
                    }
                }
            } catch (e: Exception) {
                call.reject(e.message ?: "Query failed")
            }
        }
    }

    // ------------------------------------------------------------------ Myket's pages (intents)

    /** "review" (rate and review the game), "developer" (the developer's games) or "details" (the game). Without Myket, its website. */
    @PluginMethod
    fun open(call: PluginCall) {
        val pkg = context.packageName
        val uri = when (call.getString("page")) {
            "review" -> "myket://comment?id=$pkg"
            "developer" -> "myket://developer/$pkg"
            else -> "myket://details?id=$pkg"
        }
        val starter = activity ?: context
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
        if (activity == null) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            try {
                starter.startActivity(intent)
            } catch (e: ActivityNotFoundException) {
                intent.data = Uri.parse("https://myket.ir/app/$pkg")
                starter.startActivity(intent)
            }
            call.resolve()
        } catch (e: Exception) {
            call.reject("Couldn't open Myket.", "FAILED")
        }
    }

    override fun handleOnDestroy() {
        dispose()
        super.handleOnDestroy()
    }
}
