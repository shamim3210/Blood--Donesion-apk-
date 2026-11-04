/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-9a4cb87b'], (function (workbox) { 'use strict';

  workbox.setCacheNameDetails({
    prefix: "bloodsearch-pwa-v5"
  });
  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "index.html",
    "revision": "ad184f14f996d4ed809321cbaf07a42d"
  }, {
    "url": "icon.svg",
    "revision": "2ddacaefa104f2248066616add973688"
  }, {
    "url": "favicon.ico",
    "revision": "f90c01be3c16bce9095b618824bd3e69"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-aGB9QjfI.js",
    "revision": null
  }, {
    "url": "assets/smartphone-DW9nhHvz.js",
    "revision": null
  }, {
    "url": "assets/qr-code-CuJ6TWMb.js",
    "revision": null
  }, {
    "url": "assets/layers-tDewu3CO.js",
    "revision": null
  }, {
    "url": "assets/jsx-dev-runtime-COIo3Sdt.js",
    "revision": null
  }, {
    "url": "assets/index-U5qNfmIT.js",
    "revision": null
  }, {
    "url": "assets/index-BO2loiFL.css",
    "revision": null
  }, {
    "url": "assets/heart-handshake-B_nimt1T.js",
    "revision": null
  }, {
    "url": "assets/award-D7SzLHpW.js",
    "revision": null
  }, {
    "url": "assets/activity-CtthD1F5.js",
    "revision": null
  }, {
    "url": "assets/ThalassemiaManagerModal-D6VjZ9a4.js",
    "revision": null
  }, {
    "url": "assets/SecurityAuditModal-JdSBEri3.js",
    "revision": null
  }, {
    "url": "assets/PlayStoreGuideModal-6UfLERk3.js",
    "revision": null
  }, {
    "url": "assets/PdfExactShowcase-DFPqUKaR.js",
    "revision": null
  }, {
    "url": "assets/InteractiveMapView-Bhd-hoLH.js",
    "revision": null
  }, {
    "url": "assets/FamilyVolunteerModal-BkzR9JDA.js",
    "revision": null
  }, {
    "url": "assets/EmergencyPosterModal-BbmhmbQo.js",
    "revision": null
  }, {
    "url": "assets/EmergencyDirectoryModal-rYnBjtFj.js",
    "revision": null
  }, {
    "url": "assets/EmergencyCareSuiteModal-CQdjj3sS.js",
    "revision": null
  }, {
    "url": "assets/EligibilityChecker-DKkCNpgU.js",
    "revision": null
  }, {
    "url": "assets/DonorProfileView-BSkVumLb.js",
    "revision": null
  }, {
    "url": "assets/DonorChatView-C04EVS8y.js",
    "revision": null
  }, {
    "url": "assets/DonorBadgesView-D6m7b0AV.js",
    "revision": null
  }, {
    "url": "assets/CompatibilityMatrixModal-BMO8OiaK.js",
    "revision": null
  }, {
    "url": "assets/BloodHelpOnboardingView-CiDuA_VW.js",
    "revision": null
  }, {
    "url": "assets/AdminPortal-BJNP2Yka.js",
    "revision": null
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "9d90d37a09d650917b2dcc8970b74fd0"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b18d31029591c5b6cc6e2620caa96a05"
  }, {
    "url": "pwa-192x192.png",
    "revision": "30cf858ac0e5c05e37bbac19ee50c277"
  }, {
    "url": "favicon-64x64.png",
    "revision": "f90c01be3c16bce9095b618824bd3e69"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "094928095c53509d734b126e8047fdc1"
  }, {
    "url": "manifest.webmanifest",
    "revision": "3299f0bb126f501c9292f9608fb846a3"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/auth\//, /^\/downloads\//, /^\/version\.json/, /^\/manifest\.webmanifest/, /^\/favicon\.ico/, /^\/assets\//, /\.(?:js|css|json|webmanifest|png|svg|ico|woff2?)(?:\?.*)?$/i, /^\/__/, /^\/\.well-known\//]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 12,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/(?:[abc]\.)?tile\.openstreetmap\.(?:org|fr)\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "bangladesh-map-tiles-cache-v2",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 250,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
