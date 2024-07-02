class TableManager {
    constructor(tableElement) {
        this.tableElement = tableElement;
        this.templateRow = null; // Property to store the cloned template row
        this.initializeTemplateRow();
        this.apiUrl = tableElement.getAttribute('data-api-table');
        this.itemsPerPage = parseInt(this.tableElement.getAttribute('data-api-table-item-limit'), 10) || 10;
        this.currentPage = 1; // Start from the first page
        this.totalItems = 0; // Assuming this will be fetched or set somehow
        this.setupPaginationControls();
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
        this.fetchAndPopulate(); // Fetch data and populate the table
    }

    clearTableContent() {
        const tbody = this.tableElement.querySelector('tbody');
        tbody.innerHTML = ''; // Clear the tbody to remove stale data
    }

    setupPaginationControls() {
        this.nextButton = this.tableElement.querySelector('[data-api-table-pagination="next"]');
        this.prevButton = this.tableElement.querySelector('[data-api-table-pagination="previous"]');

        // Add event listener for the next button
        this.nextButton.addEventListener('click', async () => {
            this.currentPage++;
            await this.fetchAndPopulate();
        });

        // Add event listener for the previous button
        this.prevButton.addEventListener('click', async () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                await this.fetchAndPopulate();
            }
        });

        this.updatePaginationControls(); // Initial update based on current state
    }


// Assuming this is part of the TableManager class

initializeSorting() {
    const sortableColumns = this.tableElement.querySelectorAll('[data-api-table-sort="number"]');
    sortableColumns.forEach(column => {
        column.addEventListener('click', () => {
            const sortAttribute = column.getAttribute('data-column-name');
            this.currentSortAttribute = sortAttribute;
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc'; // Toggle sort direction
            this.fetchAndPopulate();
        });
    });
}

    async fetchAndPopulate() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Network response was not ok.');

            let data = await response.json();

        // Sort data if a sort attribute is set
        if (this.currentSortAttribute) {
            data = this.cleanAndSortData(data, this.currentSortAttribute, this.currentSortDirection);
            console.log('Sorting by:', this.currentSortAttribute, this.currentSortDirection);
        }

            // Identify if there's a sortable column
            const sortableColumn = this.tableElement.querySelector('[data-api-table-sort="number"]');
            if (sortableColumn) {
                const sortAttribute = sortableColumn.getAttribute('data-column-name'); // Assuming each sortable header has a data-column-name attribute
                data = this.cleanAndSortData(data, sortAttribute);
                console.log('sort found.')
            }

            this.totalItems = data.length;
            const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const pageData = data.slice(startIndex, endIndex);

            // Prepare new rows in memory before clearing the existing content
            const fragment = document.createDocumentFragment();
            pageData.forEach((item, index) => {
                const row = this.templateRow.cloneNode(true);

                // Populate row with data as before
                row.querySelectorAll('[data-api-table-row-index]').forEach(element => {
                    element.textContent = index + 1;
                });

                row.querySelectorAll('[data-api-table-text]').forEach(element => {
                    const attr = element.getAttribute('data-api-table-text');
                    if (item[attr] !== undefined) {


                        if (element.hasAttribute('data-negative-color') || element.hasAttribute('data-format-number')) {
                            const numericValue = parseFloat(item[attr]);
                            if (!isNaN(numericValue)) {
                                const formattedValue = this.formatNumber(numericValue);
                                element.textContent = formattedValue;
                                if (numericValue < 0 && element.hasAttribute('data-negative-color')) {
                                    element.parentNode.style.color = element.getAttribute('data-negative-color');
                                }
                            }
                        } else {
                            element.textContent = item[attr];
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
            this.updatePaginationControls(totalPages);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }

    cleanAndSortData(data, sortAttribute) {
        return data.sort((a, b) => {
            // Ensure the attribute exists and is a string; otherwise, use a default string to avoid errors
            const aValueStr = a[sortAttribute] ? a[sortAttribute].toString() : '';
            const bValueStr = b[sortAttribute] ? b[sortAttribute].toString() : '';

            // Convert the cleaned string to a float
            const aValue = parseFloat(aValueStr.replace(/[^\d.-]/g, ''));
            const bValue = parseFloat(bValueStr.replace(/[^\d.-]/g, ''));

            // Handle NaN values by treating them as 0 to avoid sort comparison issues
            const aValueFinal = isNaN(aValue) ? 0 : aValue;
            const bValueFinal = isNaN(bValue) ? 0 : bValue;

            return bValueFinal - aValueFinal; // For descending order
        });
    }
    
    updatePaginationControls(totalPages) {
        // Show or hide previous button
        this.prevButton.style.display = this.currentPage > 1 ? 'flex' : 'none';

        // Show or hide next button
        this.nextButton.style.display = this.currentPage < totalPages ? 'flex' : 'none';

    }

    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        return num.toString();
    }

}

document.querySelectorAll('[data-api-table]').forEach(tableElement => {
    const manager = new TableManager(tableElement);
    manager.fetchAndPopulate();
    // Store the instance on the table element
    tableElement.tableManager = manager;
});

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
                    console.error('TableManager instance not found for the table');
                }
            } else {
                console.error('No sibling [data-api-table] element found');
            }
        }
    }
});

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
