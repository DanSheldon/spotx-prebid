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
                outstream_options: { // Needed for the default outstream renderer. Fields slot or content_width/content_height are mandatory
                    slot: 'adContainer1',
                    content_width: 300,
                    content_height: 250
                },
                outstream_function: myOutstreamFunction // Override the default outstream renderer by this referenced function
            }
        }]
    }];

```
