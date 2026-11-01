package com.jollypanda.choochoopop;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // must be registered before super
        registerPlugin(BazaarBillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
