# Overview

```
Module Name: SpotX Bidder Adapter
Module Type: Bidder Adapter
Maintainer: teameighties@spotx.tv
```

# Description

Connect to SpotX for bids.

This adapter requires setup and approval from the SpotX team.

# Test Parameters
```
    var adUnits = [{
        code: 'something',
        mediaTypes: {
            video: {
                context: 'outstream', // 'instream' or 'outstream'
                playerSize: [640, 480]
            }
        },
        bids: [{
            bidder: 'spotx',
            params: {
                channel_id: 79391,
                ad_unit: 'outstream',
                outstream_options: { // Needed for the default outstream renderer. Fields video_slot/content_width/content_height are mandatory
                    video_slot: 'video1',
                    content_width: 300,
                    content_height: 250,
                    custom_override: [{ // This option is not mandatory though used to override default renderer parameters using EASI player options in here: https://developer.spotxchange.com/content/local/docs/sdkDocs/EASI/README.md
                        name: 'content_width',
                        value: 640
                    }, {
                        name: 'content_height',
                        value: 480
                    }, {
                        name: 'ad_mute',
                        value: '0'
                    }, {
                        name: 'collapse',
                        value: '0'
                    }, {
                        name: 'autoplay',
                        value: '1'
                    }, {
                        name: 'blocked_autoplay_override_mode',
                        value: '1'
                    }, {
                        name: 'video_slot_can_autoplay',
                        value: '1'
                    }, {
                        name: 'hide_fullscreen',
                        value: '1'
                    }, {
                        name: 'unmute_on_mouse',
                        value: '1'
                    }, {
                        name: 'click_to_replay',
                        value: '1'
                    }, {
                        name: 'continue_out_of_view',
                        value: '1'
                    }, {
                        name: 'ad_volume',
                        value: '100'
                    }, {
                        name: 'content_container_id',
                        value: 'video1'
                    }]
                },
                outstream_function: myOutstreamFunction // Override the default outstream renderer by this referenced function
            }
        }]
    }];

```
