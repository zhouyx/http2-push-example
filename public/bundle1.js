self.AMP_CONFIG||(self.AMP_CONFIG={"localDev":true,"allow-doc-opt-in":["amp-date-picker","amp-next-page","ampdoc-shell","disable-amp-story-desktop","linker-meta-opt-in","inabox-viewport-friendly","amp-img-auto-sizes"],"allow-url-opt-in":["pump-early-frame","twitter-default-placeholder","twitter-default-placeholder-pulse","twitter-default-placeholder-fade"],"canary":0,"expAdsenseA4A":0.01,"a4aProfilingRate":0.01,"ad-type-custom":1,"amp-access-iframe":1,"amp-apester-media":1,"amp-ima-video":1,"amp-playbuzz":1,"chunked-amp":1,"amp-auto-ads":1,"amp-auto-ads-adsense-holdout":0.1,"amp-auto-ads-adsense-responsive":0.05,"version-locking":1,"as-use-attr-for-format":0.01,"a4aFastFetchDoubleclickLaunched":0,"a4aFastFetchAdSenseLaunched":0,"pump-early-frame":1,"amp-live-list-sorting":1,"amp-sidebar toolbar":1,"amp-consent":1,"amp-story-responsive-units":1,"amp-story-v1":1,"expAdsenseUnconditionedCanonical":0.01,"expAdsenseCanonical":0.01,"font-display-swap":1,"amp-date-picker":1,"linker-meta-opt-in":1,"user-error-reporting":1,"no-initial-intersection":1,"no-sync-xhr-in-ads":1,"doubleclickSraExp":0.01,"doubleclickSraReportExcludedBlock":0.1,"ampdoc-closest":0.01,"linker-form":1,"scroll-height-bounce":0,"scroll-height-minheight":0,"hidden-mutation-observer":1,"sandbox-ads":1,"fixed-elements-in-lightbox":1,"amp-list-viewport-resize":1,"amp-list-resizable-children":1,"amp-auto-lightbox":0.5,"amp-list-load-more":1,"amp-ad-ff-adx-ady":0.01});/*AMP_CONFIG*/var global=self;self.AMP=self.AMP||[];try{(function(_){
  (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
  "use strict";

console.log('Bundle 1')
document.body.innerHTML += '<p>Bundle 1 loaded</p>'

function addBundle(path) {
  var script = document.createElement('script');
  script.async = true;
  script.src = path;
  document.head.appendChild(script);
}

addBundle('https://localhost:3000/bundle2.js');
