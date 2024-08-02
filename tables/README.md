
# API Tables For Webflow #

This API Tables script is designed to easily render data from JSON datafeeds into readable tables on the front end of your Webflow projects.

We recommend using Finsweet's table application located in the apps tab inside the Webflow designer for your project to generate a table out of custom elements.

Please Note - At this current stage this script will only accept an object containing an array of data, e.g., [{},{},{}]

## Setting Up A Table ##

Once you have generated a table, you must wrap this in a div and apply the following attribute to initialize a table instance on the page. You can have as many instances as you like on a page, but each instance can only contain a single table.

**[data-api-table="DATAFEED"]**

The value of the attribute should be the URL of the datafeed you wish to populate the table with. For example:

**[data-api-table="https://proxy-server-for-api-167db7ac1e71.herokuapp.com/api/formatted-data"]**

### Table Settings ###

Currently, the table only supports a single setting to control the pagination, which is also controlled via an attribute:

**[data-api-table-item-limit="ITEMS PER PAGE"]**

For Example:

**[data-api-table-item-limit="10"]**

Will limit the table to display 10 items per page.

// Documentation on pagination is currently unavailable.  

## Adding Data Into Your Table ##

The headers for your table should be set normally in Webflow. The system works by duplicating the first row of your table and using this as a template for each of the remaining rows on a page.

When you create your first row, you should enter some placeholder content similar to how you expect your data to appear before adding a span to this content and then applying a data attribute to tell the script which data to assign from your datafeed.

**[data-api-table-text]** & **[data-api-table-image-source]** will apply the corresponding value from the data feed as either the text content or the image source to elements they have been applied to.

## Hiding Data From Appearing In The Table ##

Occasionally, datafeeds will have undesirable data contained within them. The recommendation is to ensure any data is removed from the database; however, that isn't always the easiest. For this reason, I have added the ability to target specific items by the data key and values to filter out the unwanted items.

To hide items, you need to add the hide data attribute to the main table element. This is [data-api-table-hide]. The value of which may look like this: symbol=[TONCOIN]. This will filter any items that have the value of TONCOIN in the symbol key. To filter additional items in the symbol key, we simply separate them by a comma. For example, symbol=[TONCOIN,BTC] will now filter TONCOIN & BTC from appearing in our table. We can filter by multiple keys by separating these by a comma as well. For example, symbol=[TONCOIN],price=[1234,56789].

### Formatting Content ### 

Text elements can also be assigned the following attributes to apply formatting to them:

| Attribute  | Description |
| ---------- | ----------- |
| **[data-format-number=true]** | This will format the text as a number and apply shorthand for millions, billions, and trillions. |
| **[data-negative-color="#HEXCODE"]** | If the number is negative, then the text's color will change to match that of the hex code applied to the value of this attribute. |
| **[data-format-fixto="NUMBER"]** | The value of this attribute will limit a number to the specified decimal places. For example, a value of 3 would restrict a number to 3 decimal places. This should be combined with [data-format-number=true]. |
