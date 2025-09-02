// ==UserScript==
// @name         G-2425G-A Show IP Address Beside Device Name
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Display IP addresses next to device names in router interface on Nokia G-2425 router overview page
// @author       Praveen Parsa
// @match        http://192.168.*.*/*
// @license     MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Interface type icons mapping
    const interfaceIcons = {
        'Ethernet': '🔌',
        '802.11': '📶',
        '802.11ac': '📶',
        'WiFi': '📶',
        'Wireless': '📶',
        'default': '🔗'
    };

    // Wait for the page to load and the DeviceStatus to be available
    function waitForDeviceStatus() {
        if (typeof DeviceStatus !== 'undefined' && DeviceStatus.Device_list) {
            addIPAddresses();
        } else {
            setTimeout(waitForDeviceStatus, 100);
        }
    }

    function getInterfaceIcon(interfaceType) {
        return interfaceIcons[interfaceType] || interfaceIcons['default'];
    }

    function addIPAddresses() {
        // Create a mapping of hostnames to device info
        const deviceMap = {};
        DeviceStatus.Device_list.forEach(device => {
            const hostname = device.HostName || `Unknown_${device.MACAddress}`;
            deviceMap[hostname] = {
                ipAddress: device.IPAddress,
                interfaceType: device.InterfaceType,
                macAddress: device.MACAddress
            };
        });

        // Wait for the table to be populated
        setTimeout(() => {
            const deviceRows = document.querySelectorAll('#DevicesCartb tr');

            deviceRows.forEach(row => {
                const nameCell = row.querySelector('td');
                if (nameCell) {
                    const deviceName = nameCell.textContent.trim();
                    const deviceInfo = deviceMap[deviceName];

                    if (deviceInfo && deviceInfo.ipAddress) {
                        const icon = getInterfaceIcon(deviceInfo.interfaceType);

                        // Add interface icon, IP address with HTTP and HTTPS links next to device name
                        nameCell.innerHTML = `
                            <span style="display: inline-flex; align-items: center; gap: 8px;">
                                <span>${deviceName}</span>
                                <span style="font-size: 1.2em;" title="${deviceInfo.interfaceType}">${icon}</span>
                                <span style="color: #666; font-size: 0.9em;">
                                    (${deviceInfo.ipAddress})
                                    <a href="http://${deviceInfo.ipAddress}" target="_blank" style="color: #007bff; text-decoration: none; margin-left: 5px;" title="Open HTTP">HTTP</a>
                                    <span style="color: #ccc;"> | </span>
                                    <a href="https://${deviceInfo.ipAddress}" target="_blank" style="color: #28a745; text-decoration: none;" title="Open HTTPS">HTTPS</a>
                                </span>
                            </span>`;
                    }
                }
            });
        }, 500);
    }

    // Start the process
    waitForDeviceStatus();

    // Also watch for dynamic updates
    const observer = new MutationObserver(() => {
        if (document.querySelector('#DevicesCartb tr')) {
            addIPAddresses();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
