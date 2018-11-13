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
        bids: [{
            bidder: 'spotx',
            params: {
                video: {
                    channel_id: 79391,
                    ad_unit: 'outstream',
                    outstream_options: {
                        video_slot: 'video1',
                        content_width: 300,
                        content_height: 250
                    },
                    outstream_function: myOutstreamFunction // Override the default outstream renderer by this referenced function
                }
            }
        }]
    }];

```
