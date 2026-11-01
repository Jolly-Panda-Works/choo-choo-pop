package com.jollypanda.choochoopop

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.PluginMethod
import ir.cafebazaar.poolakey.Connection
import ir.cafebazaar.poolakey.Payment
import ir.cafebazaar.poolakey.config.PaymentConfiguration
import ir.cafebazaar.poolakey.config.SecurityCheck
import ir.cafebazaar.poolakey.request.PurchaseRequest

/**
 * Capacitor bridge for Cafe Bazaar in-app billing (Poolakey).
 * Persian edition only (src/edition-fa). JS side: src/services/bazaar.js.
 *
 * Methods: connect({ rsaPublicKey }), disconnect(), getSkuDetails({ productIds }),
 *          purchase({ productId, payload? }), consume({ purchaseToken }), getPurchased().
 * Every method rejects with a readable message when it fails; purchase also reports `cancelled`.
 */
@CapacitorPlugin(name = "BazaarBilling")
class BazaarBillingPlugin : Plugin() {
    private var payment: Payment? = null
    private var connection: Connection? = null

    private fun purchaseJson(p: ir.cafebazaar.poolakey.entity.PurchaseInfo) = JSObject().apply {
        put("productId", p.productId)
        put("purchaseToken", p.purchaseToken)
        put("orderId", p.orderId)
        put("payload", p.payload)
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        val key = call.getString("rsaPublicKey")
        if (key.isNullOrBlank()) return call.reject("rsaPublicKey is missing")
        activity.runOnUiThread {
            try {
                connection?.disconnect()
                val config = PaymentConfiguration(localSecurityCheck = SecurityCheck.Enable(rsaPublicKey = key))
                val p = Payment(context = context, config = config)
                payment = p
                connection = p.connect {
                    connectionSucceed { call.resolve() }
                    connectionFailed { t -> call.reject(t.message ?: "Bazaar connection failed") }
                    disconnected { payment = null }
                }
            } catch (e: Exception) {
                call.reject(e.message ?: "Bazaar connection failed")
            }
        }
    }

    @PluginMethod
    fun disconnect(call: PluginCall) {
        activity.runOnUiThread {
            connection?.disconnect()
            connection = null
            payment = null
            call.resolve()
        }
    }

    @PluginMethod
    fun getSkuDetails(call: PluginCall) {
        val p = payment ?: return call.reject("Not connected to Bazaar")
        val ids = call.getArray("productIds")?.toList<String>() ?: return call.reject("productIds is missing")
        p.getInAppSkuDetails(ids) {
            getSkuDetailsSucceed { list ->
                val out = JSArray()
                list.forEach {
                    out.put(JSObject().apply {
                        put("productId", it.sku)
                        put("price", it.price)
                        put("title", it.title)
                    })
                }
                call.resolve(JSObject().apply { put("list", out) })
            }
            getSkuDetailsFailed { t -> call.reject(t.message ?: "Could not read prices") }
        }
    }

    @PluginMethod
    fun purchase(call: PluginCall) {
        val p = payment ?: return call.reject("Not connected to Bazaar")
        val productId = call.getString("productId") ?: return call.reject("productId is missing")
        val request = PurchaseRequest(productId = productId, payload = call.getString("payload"))
        activity.runOnUiThread {
            p.purchaseProduct(registry = activity.activityResultRegistry, request = request) {
                failedToBeginFlow { t -> call.reject(t.message ?: "Could not open Bazaar") }
                purchaseSucceed { entity -> call.resolve(purchaseJson(entity)) }
                purchaseCanceled { call.reject("cancelled", "CANCELLED") }
                purchaseFailed { t -> call.reject(t.message ?: "Purchase failed") }
            }
        }
    }

    @PluginMethod
    fun consume(call: PluginCall) {
        val p = payment ?: return call.reject("Not connected to Bazaar")
        val token = call.getString("purchaseToken") ?: return call.reject("purchaseToken is missing")
        p.consumeProduct(token) {
            consumeSucceed { call.resolve() }
            consumeFailed { t -> call.reject(t.message ?: "Consume failed") }
        }
    }

    /** Purchases Bazaar still lists as owned: unconsumed coin packs (grant was interrupted) and non-consumables. */
    @PluginMethod
    fun getPurchased(call: PluginCall) {
        val p = payment ?: return call.reject("Not connected to Bazaar")
        p.getPurchasedProducts {
            queryFailed { t -> call.reject(t.message ?: "Query failed") }
            querySucceed { list ->
                val out = JSArray()
                list.forEach { out.put(purchaseJson(it)) }
                call.resolve(JSObject().apply { put("list", out) })
            }
        }
    }

    override fun handleOnDestroy() {
        connection?.disconnect()
        connection = null
        payment = null
        super.handleOnDestroy()
    }
}
