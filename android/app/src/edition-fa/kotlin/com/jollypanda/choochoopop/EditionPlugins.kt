package com.jollypanda.choochoopop

import com.getcapacitor.Plugin

/** Persian edition (Cafe Bazaar): registers the Bazaar in-app billing plugin. */
object EditionPlugins {
    @JvmStatic
    fun plugins(): List<Class<out Plugin>> = listOf(BazaarBillingPlugin::class.java)
}
