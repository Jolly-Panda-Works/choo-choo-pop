package com.jollypanda.choochoopop;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // must be registered before super; the plugin of the store this build is for (src/<store>)
        if (StorePlugins.PLUGIN != null) registerPlugin(StorePlugins.PLUGIN);
        if (StorePlugins.ADS_PLUGIN != null && !getString(R.string.tapsell_app_key).isEmpty()) {
            registerPlugin(StorePlugins.ADS_PLUGIN);
        }
        try {
            registerPlugin(Class.forName("com.jollypanda.choochoopop.MetrixEvents")
                    .asSubclass(com.getcapacitor.Plugin.class));
        } catch (ClassNotFoundException ignored) {
            // Only configured release builds include the SDK.
        }
        super.onCreate(savedInstanceState);
    }
}
