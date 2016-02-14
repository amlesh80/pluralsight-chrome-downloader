# Welcome to the Pluralsight auto downloader (proof of concept)

This is a chrome extension to install this extension download the source and use the developer mode to activate it.

Once this is done login to [Pluralsight](https://app.pluralsight.com) and go to your course. 
When you are looking at the player the [Pluralsight](https://app.pluralsight.com) icon should become active pressing this button will simulate the download process (aka log the mp4 urls to the plugin console).

## Violating Pluralinsight Terms of use

Be aware that downloading anything from Pluralsight will make you break there [Terms of use](https://www.pluralsight.com/terms).

Since this is a proof of concept the line `chrome.downloads.download({ url: msg.url, filename: msg.filename, conflictAction: "prompt" });` is not included in [background.js](background.js) on line 56. 

**This plugin is only a proof of concept and should not be used for piracy or any other none legal purposes**
