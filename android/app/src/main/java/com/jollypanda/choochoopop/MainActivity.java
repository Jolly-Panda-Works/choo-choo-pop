package com.jollypanda.choochoopop;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // must be registered before super; the plugin of the store this build is for (src/<store>)
        if (StorePlugins.PLUGIN != null) registerPlugin(StorePlugins.PLUGIN);
        super.onCreate(savedInstanceState);
    }
}
