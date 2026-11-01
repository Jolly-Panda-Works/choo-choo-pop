// Cafe Bazaar's login check (https://developers.cafebazaar.ir/fa/guidelines/feature/login-check).
// Used by the fa edition only (aidl source set in app/build.gradle).
package com.farsitel.bazaar;
interface ILoginCheckService {
    boolean isLoggedIn();
}
