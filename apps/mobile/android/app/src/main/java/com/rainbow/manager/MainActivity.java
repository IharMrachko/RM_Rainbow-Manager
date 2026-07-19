package com.rainbow.manager;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Keep content below status/nav bars (Android 15 edge-to-edge otherwise covers the header).
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
  }
}
