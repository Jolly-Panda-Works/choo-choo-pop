package com.jollypanda.choochoopop

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.net.Uri
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.activity.result.ActivityResult
import androidx.lifecycle.LifecycleOwner
import com.farsitel.bazaar.BazaarClientProxy
import com.farsitel.bazaar.ILoginCheckService
import com.farsitel.bazaar.core.BazaarSignIn
import com.farsitel.bazaar.core.callback.BazaarSignInCallback
import com.farsitel.bazaar.core.model.BazaarSignInOptions
import com.farsitel.bazaar.core.model.SignInOption
import com.farsitel.bazaar.storage.BazaarStorage
import com.farsitel.bazaar.storage.callback.BazaarStorageCallback
import com.farsitel.bazaar.updater.AutoUpdateState
import com.farsitel.bazaar.updater.BazaarAutoUpdater
import com.farsitel.bazaar.updater.BazaarUpdater
import com.farsitel.bazaar.updater.UpdateResult
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.PluginMethod
import ir.cafebazaar.poolakey.Connection
import ir.cafebazaar.poolakey.Payment
import ir.cafebazaar.poolakey.config.PaymentConfiguration
import ir.cafebazaar.poolakey.config.SecurityCheck
import ir.cafebazaar.poolakey.request.PurchaseRequest

/**
 * Capacitor bridge for Cafe Bazaar.
 * JS side: src/services/bazaar.js (billing) and src/services/bazaarApp.js (the rest).
 *
 * Billing (Poolakey): connect({ rsaPublicKey }), disconnect(), getSkuDetails({ productIds }),
 *          purchase({ productId, payload? }), consume({ purchaseToken }), getPurchased().
 * Sign in with Bazaar and its in-app storage (CafeBazaarAuth, 10 KB per player): status(), account(), signIn(),
 *          loadData(), saveData({ data }), isLoggedIn(), showInstallBazaar(), showUpdateBazaar().
 * Bazaar's pages: open({ page, developerId? }). Updates (BazaarUpdater): updateState(), update(),
 *          autoUpdateState(), enableAutoUpdate().
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

    // ------------------------------------------------------------------ sign in & storage

    private fun owner(): LifecycleOwner? = activity as? LifecycleOwner

    /** Bazaar is installed, and whether it's too old for sign-in and in-app storage. */
    @PluginMethod
    fun status(call: PluginCall) {
        val result = JSObject()
        val installed = BazaarClientProxy.isBazaarInstalledOnDevice(context)
        result.put("installed", installed)
        if (installed) {
            val info = BazaarClientProxy.isNeededToUpdateBazaar(context)
            result.put("needsUpdate", info.needToUpdateForAuth || info.needToUpdateForStorage)
        } else {
            result.put("needsUpdate", false)
        }
        call.resolve(result)
    }

    /** Bazaar's own "install Bazaar" / "update Bazaar" screens. */
    @PluginMethod
    fun showInstallBazaar(call: PluginCall) {
        BazaarClientProxy.showInstallBazaarView(activity ?: context)
        call.resolve()
    }

    @PluginMethod
    fun showUpdateBazaar(call: PluginCall) {
        BazaarClientProxy.showUpdateBazaarView(activity ?: context)
        call.resolve()
    }

    private fun accountJs(accountId: String?): JSObject {
        val o = JSObject()
        o.put("accountId", accountId)
        return o
    }

    /** The player who already let this game sign in with Bazaar (accountId null when none). */
    @PluginMethod
    fun account(call: PluginCall) {
        if (!BazaarClientProxy.isBazaarInstalledOnDevice(context)) return call.resolve(accountJs(null))
        BazaarSignIn.getLastSignedInAccount(context, owner(), BazaarSignInCallback { response ->
            call.resolve(accountJs(response?.data?.accountId))
        })
    }

    /** Bazaar's sign-in screen; resolves with the account (null if the player said no). */
    @PluginMethod
    fun signIn(call: PluginCall) {
        if (!BazaarClientProxy.isBazaarInstalledOnDevice(context)) return call.reject("Cafe Bazaar isn't installed.", "NOT_INSTALLED")
        val options = BazaarSignInOptions.Builder(SignInOption.DEFAULT_SIGN_IN).build()
        val intent = BazaarSignIn.getClient(context, options).getSignInIntent()
        startActivityForResult(call, intent, "signInResult")
    }

    @ActivityCallback
    private fun signInResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        call.resolve(accountJs(BazaarSignIn.getSignedInAccountFromIntent(result.data)?.accountId))
    }

    /** The player's save in Bazaar's in-app storage (UTF-8 text; "" when there is none). */
    @PluginMethod
    fun loadData(call: PluginCall) {
        BazaarStorage.getSavedData(context, owner(), BazaarStorageCallback { response ->
            if (response == null || !response.isSuccessful) {
                call.reject(response?.errorResponse?.errorMessage ?: "Couldn't read the Bazaar save.", "FAILED")
            } else {
                val o = JSObject()
                o.put("data", response.data?.toString(Charsets.UTF_8) ?: "")
                call.resolve(o)
            }
        })
    }

    @PluginMethod
    fun saveData(call: PluginCall) {
        val data = call.getString("data") ?: return call.reject("data is required.")
        BazaarStorage.saveData(context, owner(), data.toByteArray(Charsets.UTF_8), BazaarStorageCallback { response ->
            if (response == null || !response.isSuccessful) {
                call.reject(response?.errorResponse?.errorMessage ?: "Couldn't save to Bazaar.", "FAILED")
            } else {
                call.resolve()
            }
        })
    }

    /** Whether the player is logged in to the Bazaar app (null when Bazaar can't say). */
    @PluginMethod
    fun isLoggedIn(call: PluginCall) {
        var answered = false
        val answer = { loggedIn: Boolean? ->
            if (!answered) {
                answered = true
                val o = JSObject()
                o.put("loggedIn", loggedIn)
                call.resolve(o)
            }
        }
        val connection = object : ServiceConnection {
            override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
                val loggedIn = try {
                    ILoginCheckService.Stub.asInterface(service).isLoggedIn()
                } catch (e: Exception) {
                    null
                }
                answer(loggedIn)
                try { context.unbindService(this) } catch (e: Exception) { }
            }

            override fun onServiceDisconnected(name: ComponentName?) {}
        }
        val intent = Intent("com.farsitel.bazaar.service.LoginCheckService.BIND").setPackage(BAZAAR_PACKAGE)
        val bound = try {
            context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
        } catch (e: Exception) {
            false
        }
        if (!bound) return answer(null)
        // An old Bazaar may never answer.
        Handler(Looper.getMainLooper()).postDelayed({
            if (!answered) {
                answer(null)
                try { context.unbindService(connection) } catch (e: Exception) { }
            }
        }, 4000)
    }

    // ------------------------------------------------------------------ Bazaar pages (intents)

    /**
     * Opens a page of Bazaar: "details" (the game), "review" (rate and review it), "developer"
     * (all the developer's games; needs developerId), "update" (the in-app update page) or
     * "login". Without Bazaar, the game's page opens on the Bazaar website.
     */
    @PluginMethod
    fun open(call: PluginCall) {
        val page = call.getString("page") ?: "details"
        val pkg = context.packageName
        val installed = BazaarClientProxy.isBazaarInstalledOnDevice(context)
        val intent = if (!installed) {
            Intent(Intent.ACTION_VIEW, Uri.parse("https://cafebazaar.ir/app/$pkg"))
        } else {
            val (action, uri) = when (page) {
                "review" -> Intent.ACTION_EDIT to "bazaar://details?id=$pkg"
                "developer" -> Intent.ACTION_VIEW to "bazaar://collection?slug=by_author&aid=${call.getString("developerId") ?: ""}"
                "update" -> Intent.ACTION_VIEW to "bazaar://details/modal?id=$pkg"
                "login" -> Intent.ACTION_VIEW to "bazaar://login"
                else -> Intent.ACTION_VIEW to "bazaar://details?id=$pkg"
            }
            Intent(action, Uri.parse(uri)).setPackage(BAZAAR_PACKAGE)
        }
        val starter = activity
        if (starter == null) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            (starter ?: context).startActivity(intent)
            val o = JSObject()
            o.put("bazaar", installed)
            call.resolve(o)
        } catch (e: Exception) {
            call.reject("Couldn't open Cafe Bazaar.", "FAILED")
        }
    }

    // ------------------------------------------------------------------ updates (BazaarUpdater)

    /** "updated", "needUpdate" (with the new versionCode) or "error". */
    @PluginMethod
    fun updateState(call: PluginCall) {
        BazaarUpdater.getLastUpdateState(context) { result ->
            val o = JSObject()
            when (result) {
                is UpdateResult.NeedUpdate -> {
                    o.put("state", "needUpdate")
                    o.put("versionCode", result.getTargetVersionCode())
                }
                is UpdateResult.Error -> {
                    o.put("state", "error")
                    o.put("message", result.getError()?.message ?: "")
                }
                else -> o.put("state", "updated")
            }
            call.resolve(o)
        }
    }

    /** Bazaar's update screen for this game (the new version installs from there). */
    @PluginMethod
    fun update(call: PluginCall) {
        try {
            BazaarUpdater.updateApplication(activity ?: context)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Couldn't open the update.", "FAILED")
        }
    }

    /** "enabled", "disabled" or "unsupported" (no Bazaar, or older than 26.2). */
    @PluginMethod
    fun autoUpdateState(call: PluginCall) {
        BazaarAutoUpdater.getLastAutoUpdateState(context) { result ->
            val o = JSObject()
            o.put(
                "state",
                when (result.getState()) {
                    AutoUpdateState.ENABLED -> "enabled"
                    AutoUpdateState.DISABLED -> "disabled"
                    else -> "unsupported"
                },
            )
            call.resolve(o)
        }
    }

    @PluginMethod
    fun enableAutoUpdate(call: PluginCall) {
        BazaarAutoUpdater.enableAutoUpdate(activity ?: context)
        call.resolve()
    }

    override fun handleOnDestroy() {
        connection?.disconnect()
        connection = null
        payment = null
        try {
            BazaarSignIn.disconnect(context)
            BazaarStorage.disconnect(context)
        } catch (e: Exception) {
            // never connected
        }
        super.handleOnDestroy()
    }

    private companion object {
        const val BAZAAR_PACKAGE = "com.farsitel.bazaar"
    }
}
