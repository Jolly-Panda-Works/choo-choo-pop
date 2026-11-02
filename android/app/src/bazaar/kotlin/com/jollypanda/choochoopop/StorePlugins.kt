package com.jollypanda.choochoopop

import com.getcapacitor.Plugin

/** The Capacitor plugin of this store; MainActivity registers it. */
object StorePlugins {
    @JvmField
    val PLUGIN: Class<out Plugin> = BazaarBillingPlugin::class.java
}
