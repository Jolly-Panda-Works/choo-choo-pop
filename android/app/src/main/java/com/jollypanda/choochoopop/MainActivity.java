package com.jollypanda.choochoopop;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // edition-specific native plugins (Cafe Bazaar billing in the "fa" edition); must be registered before super
        registerPlugins(EditionPlugins.plugins());
        super.onCreate(savedInstanceState);
    }
}
