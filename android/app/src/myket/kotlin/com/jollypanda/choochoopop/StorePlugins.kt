package com.jollypanda.choochoopop

import com.getcapacitor.Plugin

/** The Capacitor plugin of this store; MainActivity registers it. */
object StorePlugins {
    @JvmField
    val ADS_PLUGIN: Class<out Plugin> = TapsellAdsPlugin::class.java

    @JvmField
    val PLUGIN: Class<out Plugin> = MyketBillingPlugin::class.java
}
