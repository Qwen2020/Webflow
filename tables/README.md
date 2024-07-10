# API Tables For Webflow #

This API Tables script is desinged to easily formatted data from json datafeeds into readable tables on the front end of your Webflow projects. 

We reccomended using Finsweet's table application located in the apps tab inside the Webflow designer for your project to generate a table out of custom elements. 

Please Note - At this current stage this script will only accpet and object containing and array of data, eg [{},{},{}]

## Setting Up A Table ##

Once you have genreated a table you must wrap this in a div and apply the following attribute to intalisalse a table instance on the page, you can have as many instances as you like on a page but each instance can only contain a single table. 

**[data-api-table="DATAFEED"]**

The value of the attribute should be the url of the datafeed you wish to populate the table with. For example; 

**[data-api-table="https://proxy-server-for-api-167db7ac1e71.herokuapp.com/api/formatted-data"]**

### Table Settings ###

Currently the table only supports a single setting to control the pagination, this is also controled via an attrbite; 

**[data-api-table-item-limit="ITEMS PER PAGE"]**

For Example;

**[data-api-table-item-limit="10"]**

Will limit the table to display 10 items per page. 

// Documentation on pagination is currently unavaliable.  

## Adding Data Into Your Table ##

The headers for your table should be set normally in Webflow, the system works be duplicating the first row of your table and using this as a template for each of the remaining rows on a page. 

When you create your first row you should enter some placeholder content similar to how you expect your data to appear before adding a span to this content and then applying a data attrbute to tell the script which data to asign from your datafeed. 

**[data-api-table-text]** & **[data-api-table-image-source]** will apply the corrspeoding value from the data feed as either the text content or the image source to elements they have been applied too. 

### Formatting Content #### 

Text elements can also be assigned the following attributes to apply formatting to them; 

| Attribute  | Description |
| ---------- | ----------- |
| **[data-format-number=true]** | This will format the text as a number and apply short hand for millions, billions and trillions. |
| **[data-negative-color="#HEXCODE"]** | If the number is negative then the texts colour will change to match that of the hex code applied to the value of this attribute. |
| **[data-format-fixto="NUMBER"]** | The value of this attribute will limit a number to the specifced demical places for example a value of 3 would restrict a number to 3 decimal places. This should be combined with [data-format-number=true] |

Text elements can also be assigned the following attributes to apply formatting to them; 

**[data-format-number=true]**  This will format the text as a number and apply short hand for millions, billions and trillions. 

**[data-negative-color="#HEXCODE"]** - If the number is negative then the texts colour will change to match that of the hex code applied to the value of this attribute. 

**[data-format-fixto="NUMBER"]** - The value of this attribute will limit a number to the specifced demical places for example a value of 3 would restrict a number to 3 decimal places. This should be combined with [data-format-number=true]
