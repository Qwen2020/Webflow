class TableManager {
    constructor(tableElement) {
        this.tableElement = tableElement;
        this.templateRow = null; // Property to store the cloned template row
        this.initializeTemplateRow();
        this.apiUrl = tableElement.getAttribute('data-api-table');
        this.itemsPerPage = parseInt(this.tableElement.getAttribute('data-api-table-item-limit'), 10) || 10;
        this.currentPage = 1; // Start from the first page
        this.totalItems = 0; // Assuming this will be fetched or set somehow
        this.allData = []; // Property to store all fetched data

        const hideAttribute = tableElement.getAttribute('data-api-table-hide');
        if (hideAttribute) {
            this.exclusionCriteria = this.parseExclusionCriteria(hideAttribute);
        } else {
            this.exclusionCriteria = {};
        }

        this.setupPaginationControls();
    }

    // Function to parse the exclusion criteria from the attribute value
    parseExclusionCriteria(attributeValue) {
        const criteria = {};
        const regex = /(\w+)=\[(.*?)\]/g;
        let match;

        while ((match = regex.exec(attributeValue)) !== null) {
            const key = match[1];
            const values = match[2].split(',').map(value => value.trim());
            criteria[key] = values;
        }

        // console.log('Parsed exclusion criteria:', criteria); // Log parsed criteria
        return criteria;
    }


    // Function to filter data based on exclusion criteria
    filterData(data, criteria) {
        // console.log('Filtering data with criteria:', criteria);
        return data.filter(item => {
            for (const key in criteria) {
                if (criteria[key].includes(item[key])) {
                    // console.log(`Excluding item with ${key}=${item[key]}`, item);
                    return false;
                }
            }
            return true;
        });
    }




    formatDate(date, format) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is zero-based
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        // Replace date placeholders
        let result = format.replace("YYYY", year.toString())
            .replace("MM", month)
            .replace("DD", day);

        // Replace time placeholders if present
        result = result.replace("HH", hours)
            .replace("mm", minutes)
            .replace("ss", seconds);

        return result;
    }

    initializeTemplateRow() {
        const tbody = this.tableElement.querySelector('tbody');
        const templateRow = tbody.querySelector('tr');
        if (templateRow) {
            this.templateRow = templateRow.cloneNode(true);
            // Optionally, remove or hide the template row from the table
            templateRow.style.display = 'none'; // Hide the template row
            tbody.innerHTML = ''; // Clear the tbody
        }
    }

    updateApiUrlAndRefetch(newUrl) {
        this.apiUrl = newUrl;
        this.currentPage = 1; // Reset the page number to 1
        this.initializeTemplateRow(); // Reinitialize the template row
        this.clearTableContent(); // Clear the table content immediately to avoid displaying stale data
        this.updatePaginationControls(1); // Update pagination controls assuming we're resetting to a state with unknown total pages
        this.fetchDataAndPopulate(); // Fetch data and populate the table
    }

    clearTableContent() {
        const tbody = this.tableElement.querySelector('tbody');
        tbody.innerHTML = ''; // Clear the tbody to remove stale data
    }

    setupPaginationControls() {
        this.nextButton = this.tableElement.querySelector('[data-api-table-pagination="next"]');
        this.prevButton = this.tableElement.querySelector('[data-api-table-pagination="previous"]');
        this.paginationNumbersContainer = this.tableElement.querySelector('[data-api-table-pagination="numbers"]');

        // Add event listener for the next button
        this.nextButton.addEventListener('click', async () => {
            if (this.currentPage < Math.ceil(this.totalItems / this.itemsPerPage)) {
                this.currentPage++;
                this.populateTable();
            }
        });

        // Add event listener for the previous button
        this.prevButton.addEventListener('click', async () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.populateTable();
            }
        });

        this.updatePaginationControls(); // Initial update based on current state
    }

    createPaginationNumbers(totalPages) {
        this.paginationNumbersContainer.innerHTML = ''; // Clear previous pagination numbers
        const fragment = document.createDocumentFragment();

        const addPageNumber = (page) => {
            const pageNumber = document.createElement('span');
            pageNumber.classList.add('pagination_number');
            if (page === this.currentPage) {
                pageNumber.classList.add('is--active');
            }
            pageNumber.textContent = page;
            pageNumber.addEventListener('click', async () => {
                this.currentPage = page;
                this.populateTable();
            });
            fragment.appendChild(pageNumber);
        };

        const addEllipsis = () => {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.classList.add('pagination_dots');
            fragment.appendChild(ellipsis);
        };

        if (totalPages <= 6) {
            for (let i = 1; i <= totalPages; i++) {
                addPageNumber(i);
            }
        } else {
            addPageNumber(1);

            if (this.currentPage > 4) {
                addEllipsis();
            }

            const startPage = Math.max(2, this.currentPage - 1);
            const endPage = Math.min(totalPages - 1, this.currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                addPageNumber(i);
            }

            if (this.currentPage < totalPages - 3) {
                addEllipsis();
            }

            addPageNumber(totalPages);
        }

        this.paginationNumbersContainer.appendChild(fragment);
    }

    async fetchDataAndPopulate() {
        // console.log('fetchDataAndPopulate started'); // Step 1
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Network response was not ok.');

            const data = await response.json();
            //   console.log('Data fetched successfully', data); // Step 2

            // Apply filtering
            if (this.exclusionCriteria) {
                this.allData = this.filterData(data, this.exclusionCriteria);
            } else {
                this.allData = data;
            }

            //  console.log('Filtered data', this.allData); // Step 3

            this.totalItems = this.allData.length;
            const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

            this.updatePaginationControls(totalPages);
            this.populateTable();
            // console.log('DOM updated successfully'); // Step 5
        } catch (error) {
            // console.error('Failed to fetch and populate data:', error); // Enhanced Error Logging
        }
    }

    populateTable() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.allData.slice(startIndex, endIndex);

        //  console.log('Preparing to update DOM with fetched data'); // Step 4

        // Prepare new rows in memory before clearing the existing content
        const fragment = document.createDocumentFragment();

        pageData.forEach((item, index) => {
            const row = this.templateRow.cloneNode(true);

            // Populate row with data
            row.querySelectorAll('[data-api-table-row-index]').forEach(element => {
                element.textContent = startIndex + index + 1; // Adjusted to reflect actual data index
            });
            row.querySelectorAll('[data-api-table-text]').forEach(element => {
                const attr = element.getAttribute('data-api-table-text');
                if (item[attr] !== undefined) {
                    let content = item[attr] === null ? "N/A" : item[attr];

                    // Check if the element has the data-prepend attribute
                    if (element.hasAttribute('data-prepend')) {
                        const prependValue = element.getAttribute('data-prepend');
                        if (typeof content === 'number' && content < 0) {
                            content = '-' + prependValue + Math.abs(content); // Prepend after the negative sign
                        } else {
                            content = prependValue + content; // Prepend normally
                        }
                    }

                    // Check if the element has the data-append attribute
                    if (element.hasAttribute('data-append')) {
                        const appendValue = element.getAttribute('data-append');
                        content += appendValue; // Append the value of data-append to the content
                    }

                    // Check if the element has the data-timestamp attribute
                    if (element.hasAttribute('data-timestamp')) {
                        const format = element.getAttribute('data-timestamp');
                        const timestamp = parseInt(content, 10); // Parse the content as an integer
                        const date = new Date(timestamp); // Create a Date object using the timestamp
                        if (!isNaN(date.getTime())) { // Check if the date is valid
                            let formattedDate = `${('0' + date.getDate()).slice(-2)}-${('0' + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear().toString().substr(-2)}`;
                            content = `${formattedDate}`;
                        } else {
                            content = "Invalid Date"; // Handle invalid date
                        }
                    }


                    if (item[attr] === null) {
                        if (element.tagName.toLowerCase() === 'span') {
                            element.parentNode.textContent = content;
                        } else {
                            element.textContent = content;
                        }
                    } else {
                        let numericValue;

                        if (element.hasAttribute('data-negative-color') || element.hasAttribute('data-format-number')) {
                            numericValue = parseFloat(item[attr]);
                            if (!isNaN(numericValue)) {
                                let formattedValue = this.formatNumber(numericValue);

                                if (element.hasAttribute('data-format-fixto')) {
                                    const decimals = parseInt(element.getAttribute('data-format-fixto'), 10);
                                    formattedValue = numericValue.toFixed(decimals);
                                }

                                if (numericValue < 0) {
                                    let value = formattedValue.toString();
                                    let numericPart = parseFloat(value);
                                    let nonNumericPart = value.replace(/[0-9.-]/g, '');

                                    formattedValue = '-' + (element.hasAttribute('data-prepend') ? element.getAttribute('data-prepend') : '') + Math.abs(numericPart) + nonNumericPart;
                                } else {
                                    formattedValue = (element.hasAttribute('data-prepend') ? element.getAttribute('data-prepend') : '') + formattedValue;
                                }

                                formattedValue += element.hasAttribute('data-append') ? element.getAttribute('data-append') : '';
                                element.textContent = formattedValue;

                                if (numericValue < 0 && element.hasAttribute('data-negative-color')) {
                                    element.parentNode.style.color = element.getAttribute('data-negative-color');
                                } else {
                                    element.parentNode.style.color = ''; // Reset to default color
                                }
                            }
                        } else if (element.hasAttribute('data-format-time')) {
                            const format = element.getAttribute('data-format-time');
                            const date = new Date(item[attr]);
                            const formattedDate = this.formatDate(date, format);
                            element.textContent = (element.hasAttribute('data-prepend') ? element.getAttribute('data-prepend') : '') + formattedDate + (element.hasAttribute('data-append') ? element.getAttribute('data-append') : '');
                        } else {
                            element.textContent = content;
                            if (element.parentNode.style.color !== '') {
                                element.parentNode.style.color = ''; // Reset to default color
                            }
                        }
                    }
                }
            });

            // Handle image sources
            row.querySelectorAll('[data-api-table-image-source]').forEach(element => {
                const imageAttr = element.getAttribute('data-api-table-image-source');
                if (item[imageAttr] !== undefined) {
                    element.src = item[imageAttr];
                }
            });

            // Handle chart rendering
            row.querySelectorAll('[data-api-table-chart]').forEach(element => {
                const chartAttr = element.getAttribute('data-api-table-chart');
                if (item[chartAttr] !== undefined) {
                    const chartData = item[chartAttr];
                    element.src = `data:image/png;base64,${chartData}`;
                }
            });
            // Append the prepared row to the fragment
            fragment.appendChild(row);
        });

        // Capture current table height
        const tbody = this.tableElement.querySelector('tbody');
        const currentHeight = tbody.offsetHeight;
        tbody.style.height = `${currentHeight}px`; // Set the table height explicitly

        // Clear existing content and append new rows
        tbody.innerHTML = ''; // Clear existing content
        tbody.appendChild(fragment); // Append new rows

        // Reset table height to auto
        tbody.style.height = 'auto';

        // Update pagination controls as needed
        this.updatePaginationControls(Math.ceil(this.totalItems / this.itemsPerPage));
    }

    updatePaginationControls(totalPages) {
        // Show or hide previous button
        this.prevButton.style.display = this.currentPage > 1 ? 'flex' : 'none';

        // Show or hide next button
        this.nextButton.style.display = this.currentPage < totalPages ? 'flex' : 'none';

        // Create and update pagination numbers
        this.createPaginationNumbers(totalPages);
    }

    formatNumber(num) {
        const absNum = Math.abs(num);
        let formattedNum;

        if (absNum >= 1e12) {
            formattedNum = (absNum / 1e12).toFixed(2) + 'T';
        } else if (absNum >= 1e9) {
            formattedNum = (absNum / 1e9).toFixed(2) + 'B';
        } else if (absNum >= 1e6) {
            formattedNum = (absNum / 1e6).toFixed(2) + 'M';
        } else {
            formattedNum = absNum.toString();
        }

        return num < 0 ? '-' + formattedNum : formattedNum;
    }
}

document.querySelectorAll('[data-api-table]').forEach(tableElement => {
    const manager = new TableManager(tableElement);
    manager.fetchDataAndPopulate();
    // Store the instance on the table element
    tableElement.tableManager = manager;
});

// Update the table URL and refetch data when a menu item is clicked

document.addEventListener('click', function (event) {
    // Use closest to find the clicked element or its closest ancestor with the data-api-table-url attribute
    let targetElement = event.target.closest('[data-api-table-url]');

    if (targetElement) {
        // Find the parent with the data-api-table-menu attribute
        let parentMenu = targetElement.closest('[data-api-table-menu]');

        if (parentMenu) {
            // Find the sibling [data-api-table] element
            let tableElement = parentMenu.nextElementSibling;
            while (tableElement && !tableElement.hasAttribute('data-api-table')) {
                tableElement = tableElement.nextElementSibling;
            }

            if (tableElement) {
                // Update the data-api-table attribute with the new URL
                const newUrl = targetElement.getAttribute('data-api-table-url');
                tableElement.setAttribute('data-api-table', newUrl);

                // Reinitialize the table instance
                if (tableElement.tableManager) {
                    tableElement.tableManager.updateApiUrlAndRefetch(newUrl);
                } else {
                    // console.error('TableManager instance not found for the table');
                }
            } else {
                // console.error('No sibling [data-api-table] element found');
            }
        }
    }
});

// Initalise tables on page load.

document.addEventListener('DOMContentLoaded', () => {
    // Select all elements with the [data-api-table] attribute
    const tableElements = document.querySelectorAll('[data-api-table]');

    // Iterate over each table element
    tableElements.forEach(tableElement => {
        // Create a new instance of TableManager for each table
        const tableManagerInstance = new TableManager(tableElement);
        // Assign the instance to the tableElement for later access
        tableElement.tableManager = tableManagerInstance;
    });
});

// Sort and ordering features for the table.

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-api-table-order-by]').forEach(headerItem => {
        headerItem.addEventListener('click', function () {
            const orderByValue = this.getAttribute('data-api-table-order-by');
            const tableElement = this.closest('[data-api-table]');
            if (tableElement) {
                let baseUrl = tableElement.getAttribute('data-api-table');
                const urlParts = baseUrl.split('?');
                baseUrl = urlParts[0];
                const existingParams = new URLSearchParams(urlParts[1] || '');

                // Determine the current sort and order
                const currentSort = existingParams.get('sort');
                const currentOrder = existingParams.get('order');

                // Toggle the order if the current sort matches the clicked column
                if (currentSort === orderByValue) {
                    existingParams.set('order', currentOrder === 'asc' ? 'desc' : 'asc');
                } else {
                    existingParams.set('order', 'desc'); // Default to 'asc' for new sort columns
                }

                // Always update the sort parameter
                existingParams.set('sort', orderByValue);

                const newUrl = `${baseUrl}?${existingParams.toString()}`;
                tableElement.setAttribute('data-api-table', newUrl);

                if (tableElement.tableManager) {
                    tableElement.tableManager.updateApiUrlAndRefetch(newUrl);
                } else {
                    // Assuming TableManager is a class that handles the table initialization and fetching
                    const manager = new TableManager(tableElement);
                    manager.updateApiUrlAndRefetch(newUrl);
                }
            }
        });
    });
});
