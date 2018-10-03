import * as utils from 'src/utils';
import { Renderer } from 'src/Renderer';
import { registerBidder } from 'src/adapters/bidderFactory';
import { BANNER, VIDEO } from 'src/mediaTypes';

const BIDDER_CODE = 'spotx';
const URL = '//search.spotxchange.com/openrtb/2.3/dados/';
const ORTB_VERSION = '2.3';

export const spec = {
  code: BIDDER_CODE,
  aliases: ['spotx'],
  supportedMediaTypes: [BANNER, VIDEO],

  /**
   * Determines whether or not the given bid request is valid.
   * From Prebid.js: isBidRequestValid - Verify the the AdUnits.bids, respond with true (valid) or false (invalid).
   *
   * @param {object} bid The bid to validate.
   * @return boolean True if this is a valid bid, and false otherwise.
   */
  isBidRequestValid: function(bid) {
    if (bid && (typeof bid.params !== 'object' || typeof bid.params.video !== 'object')) {
      utils.logMessage(BIDDER_CODE + ': video params is missing or is incorrect');
      return false;
    }

    if (bid.params.video.channel_id === undefined || bid.params.video.slot === undefined || bid.params.video.video_slot === undefined) {
      utils.logMessage(BIDDER_CODE + ': channel_id, slot and/or video_slot are not present in bidder params');
      return false;
    }

    let videoSlotDivId = utils.getBidIdParameter('video_slot', bid.params.video);
    if (window.document.getElementById(videoSlotDivId) === null) {
      utils.logMessage(BIDDER_CODE + ': video_slot HTML node id does not exist on the page');
      return false;
    }

    let slotDivId = utils.getBidIdParameter('slot', bid.params.video);
    if (window.document.getElementById(slotDivId) === null) {
      utils.logMessage(BIDDER_CODE + ': slot HTML node id does not exist on the page');
      return false;
    }

    if (utils.getBidIdParameter('content_width', bid.params.video) == '') {
      if (window.document.getElementById(videoSlotDivId).querySelectorAll('video').length == 0) {
        bid.params.video['content_width'] = window.document.getElementById(videoSlotDivId).offsetWidth;
      } else {
        bid.params.video['content_width'] = window.document.getElementById(videoSlotDivId).querySelectorAll('video')[0].offsetWidth;
      }
    }

    if (utils.getBidIdParameter('content_height', bid.params.video) == '') {
      if (window.document.getElementById(videoSlotDivId).querySelectorAll('video').length == 0) {
        bid.params.video['content_height'] = window.document.getElementById(videoSlotDivId).offsetHeight;
      } else {
        bid.params.video['content_height'] = window.document.getElementById(videoSlotDivId).querySelectorAll('video')[0].offsetHeight;
      }
    }

    return true;
  },

  /**
   * Make a server request from the list of BidRequests.
   * from Prebid.js: buildRequests - Takes an array of valid bid requests, all of which are guaranteed to have passed the isBidRequestValid() test.
   *
   * @param {BidRequest[]} bidRequests A non-empty list of bid requests which should be sent to the Server.
   * @return ServerRequest Info describing the request to the server.
   */
  buildRequests: function(bidRequests, bidderRequest) {
    const loc = utils.getTopWindowLocation();
    const page = loc.href;
    const isPageSecure = (loc.protocol === 'https:') ? 1 : 0;

    let siteId = '';
    let bid = bidderRequest.bids[0];
    let channelId = bid.params.video.channel_id;
    let pubcid = null;

    const contentWidth = utils.getBidIdParameter('content_width', bid.params.video);
    const contentHeight = utils.getBidIdParameter('content_height', bid.params.video);

    const spotxImps = bidRequests.map(function(bid) {
      const secure = isPageSecure || (utils.getBidIdParameter('secure', bid.params) ? 1 : 0);

      // Mandatory
      const adMute = utils.getBidIdParameter('ad_mute', bid.params.video) != '' ? 0 + Boolean(utils.getBidIdParameter('ad_mute', bid.params.video)) : 0;
      const hideSkin = utils.getBidIdParameter('hide_skin', bid.params.video) != '' ? 0 + Boolean(utils.getBidIdParameter('hide_skin', bid.params.video)) : 0;

      const ext = {
        player_width: contentWidth,
        player_height: contentHeight,
        sdk_name: 'Prebid 1+',
        ad_mute: adMute,
        ad_unit: 'outstream',
        hide_skin: hideSkin,
        content_page_url: page,
        versionOrtb: ORTB_VERSION,
        bidId: bid.bidId,
        videoSlot: bid.params.video.video_slot,
        outstream_static: bid.params.video.outstream_static ? bid.params.video.outstream_static : false
      };

      if (utils.getBidIdParameter('ad_volume', bid.params.video) != '') {
        ext.ad_volume = utils.getBidIdParameter('ad_volume', bid.params.video);
      }

      const mimes = utils.getBidIdParameter('mimes', bid.params.video) || ['application/javascript', 'video/mp4', 'video/webm'];

      const spotxImp = {
        id: Date.now(), // Use timestamp as identifier
        secure: secure,
        video: {
          w: contentWidth,
          h: contentHeight,
          ext: ext,
          mimes: mimes
        }
      };

      if (utils.getBidIdParameter('price_floor', bid.params) != '') {
        spotxImp.bidfloor = utils.getBidIdParameter('price_floor', bid.params);
      }

      if (utils.getBidIdParameter('start_delay', bid.params.video) != '') {
        spotxImp.video.startdelay = 0 + Boolean(utils.getBidIdParameter('start_delay', bid.params.video));
      }

      if (bid.crumbs && bid.crumbs.pubcid) {
        pubcid = bid.crumbs.pubcid;
      }

      return spotxImp;
    });

    const language = navigator.language ? 'language' : 'userLanguage';
    const device = {
      h: screen.height,
      w: screen.width,
      dnt: utils.getDNT() ? 1 : 0,
      language: navigator[language].split('-')[0],
      make: navigator.vendor ? navigator.vendor : '',
      ua: navigator.userAgent
    };

    let requestPayload = {
      id: channelId,
      imp: spotxImps,
      site: {
        id: siteId,
        page: page,
        content: 'content',
      },
      device: device,
      ext: {
        wrap_response: 1
      }
    };

    if (utils.getBidIdParameter('number_of_ads', bid.params)) {
      requestPayload['ext']['number_of_ads'] = utils.getBidIdParameter('number_of_ads', bid.params);
    }

    let userExt = {};

    // Add GDPR flag and consent string
    if (bidderRequest && bidderRequest.gdprConsent) {
      userExt.consent = bidderRequest.gdprConsent.consentString;

      if (typeof bidderRequest.gdprConsent.gdprApplies !== 'undefined') {
        requestPayload.regs = {
          ext: {
            gdpr: (!!bidderRequest.gdprConsent.gdprApplies ? 1 : 0)
          }
        };
      }
    }

    // Add common id if available
    if (pubcid) {
      userExt.fpc = pubcid;
    }

    // Only add the user object if it's not empty
    if (!utils.isEmpty(userExt)) {
      requestPayload.user = { ext: userExt };
    }

    return {
      method: 'POST',
      url: URL + channelId,
      data: requestPayload,
      bidRequest: bidderRequest
    };
  },

  /**
   * Unpack the response from the server into a list of bids.
   *
   * @param {*} serverResponse A successful response from the server.
   * @return {Bid[]} An array of bids which were nested inside the server.
   */
  interpretResponse: function(serverResponse, bidderRequest) {
    const bidResponses = [];
    const serverResponseBody = serverResponse.body;

    const requestMap = {};
    if (bidderRequest && bidderRequest.data && bidderRequest.data.imp) {
      utils._each(bidderRequest.data.imp, imp => requestMap[imp.id] = imp);
    }

    if (serverResponseBody && utils.isArray(serverResponseBody.seatbid)) {
      utils._each(serverResponseBody.seatbid, function(bids) {
        utils._each(bids.bid, function(spotxBid) {
          const request = requestMap[spotxBid.impid];

          const bid = {
            requestId: request.video.ext.bidId,
            currency: serverResponseBody.cur || 'USD',
            cpm: spotxBid.price,
            creativeId: spotxBid.crid || '',
            ttl: 360,
            netRevenue: true,
            channel_id: serverResponseBody.id,
            cache_key: spotxBid.ext.cache_key,
            video_slot: request.video.ext.videoSlot
          };

          if (request.video) {
            bid.vastUrl = '//search.spotxchange.com/ad/vast.html?key=' + spotxBid.ext.cache_key;
            bid.mediaType = VIDEO;
            bid.width = spotxBid.w;
            bid.height = spotxBid.h;
          }

          if (request.video.ext.ad_unit == 'outstream') {
            let renderer = Renderer.install({
              id: 0,
              url: '//',
              config: {
                adText: 'SpotX Outstream Video Ad via Prebid.js',
                player_width: request.video.ext.player_width,
                player_height: request.video.ext.player_height,
                content_page_url: request.video.ext.content_page_url,
                outstream_static: request.video.ext.outstream_static,
                ad_mute: request.video.ext.ad_mute
              }
            });

            try {
              renderer.setRender(outstreamRender);
              renderer.setEventHandlers({
                impression: function impression() {
                  return utils.logMessage('SpotX outstream video impression event');
                },
                loaded: function loaded() {
                  return utils.logMessage('SpotX outstream video loaded event');
                },
                ended: function ended() {
                  utils.logMessage('SpotX outstream renderer video event');
                }
              });
            } catch (err) {
              utils.logWarn('Prebid Error calling setRender or setEve,tHandlers on renderer', err);
            }
            bid.renderer = renderer;
          }

          bidResponses.push(bid);
        })
      });
    }

    // Make sure hb_adid will be correct
    if (bidderRequest && bidderRequest.bidRequest && bidderRequest.bidRequest.bids) {
      utils._each(bidderRequest.bidRequest.bids, function(spotxBid) {
        let adId = null;
        for (let i = 0; i < bidResponses.length; i++) {
          if (bidResponses[i].requestId == spotxBid.bidId) {
            adId = bidResponses[i].cache_key;
          }
        };
        if (adId != null) {
          spotxBid.bidId = adId;
        }
      });
    }

    return bidResponses;
  },

  /**
   * If the publisher allows user-sync activity, the platform will call this function and the adapter may register pixels and/or iframe user syncs.
   *
   */
  getUserSyncs: function(syncOptions, serverResponses) {},

  /**
   * If the adapter timed out for an auction, the platform will call this function and the adapter may register timeout.
   *
   */
  onTimeout: function(timeoutData) {}
}

function outstreamRender(bid) {
  if (bid.renderer.config.outstreamFunction != null && typeof bid.renderer.config.outstreamFunction === 'function') {
    bid.renderer.config.outstreamFunction();
    return;
  }

  window.console.log('[SPOTX][renderer] Handle SpotX outstream/inbanner renderer');

  let script = window.document.createElement('script');
  script.type = 'text/javascript';
  script.src = '//js.spotx.tv/easi/v1/' + bid.channel_id + '.js';
  script.setAttribute('data-spotx_channel_id', '' + bid.channel_id);
  script.setAttribute('data-spotx_vast_url', '' + bid.vastUrl);
  script.setAttribute('data-spotx_content_width', bid.renderer.config.player_width);
  script.setAttribute('data-spotx_content_height', bid.renderer.config.player_height);
  script.setAttribute('data-spotx_content_page_url', bid.renderer.config.content_page_url);

  window.parent.mySpotXAdDoneFunction = typeof bid.spotxAdDoneFunction === 'function' ? bid.spotxAdDoneFunction : function mySpotXAdDoneFunction(spotxAdFound) {
    if (spotxAdFound) {
      window.console.log('[SPOTX][renderer] ad playing here');
    } else {
      window.console.log('[SPOTX][renderer] code to place backup ad request here');
    }
  };
  script.setAttribute('data-spotx_ad_done_function', 'mySpotXAdDoneFunction');

  if (bid.renderer.config.ad_mute) {
    script.setAttribute('data-spotx_ad_mute', '0');
  }

  if (bid.renderer.config.outstream_static) {
    script.setAttribute('data-spotx_ad_unit', 'instream');
    script.setAttribute('data-spotx_ad_skippable', '0');
    script.setAttribute('data-spotx_custom_skin', '1');
  } else {
    script.setAttribute('data-spotx_ad_unit', 'incontent');
    script.setAttribute('data-spotx_collapse', '0');
  }

  script.setAttribute('data-spotx_autoplay', '1');
  // script.setAttribute('data-spotx_blocked_autoplay_override_mode', '1');
  script.setAttribute('data-spotx_video_slot_can_autoplay', '1');

  if (bid.renderer.config.inIframe && window.document.getElementById(bid.renderer.config.inIframe).nodeName == 'IFRAME') {
    let rawframe = window.document.getElementById(bid.renderer.config.inIframe);
    let framedoc = rawframe.contentDocument;
    if (!framedoc && rawframe.contentWindow) {
      framedoc = rawframe.contentWindow.document;
    }
    framedoc.body.appendChild(script);
  } else {
    window.document.getElementById(bid.video_slot).appendChild(script);
  }
}

registerBidder(spec);
