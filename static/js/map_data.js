function closestEmptyPort(link, used) {
    "use strict";
    var right = [1, 0, 2, 7, 3, 6, 4, 5];
    var top = [3, 2, 4, 1, 5, 0, 6, 7];
    var bottom = [6, 7, 5, 0, 4, 1, 3, 2];
    var left = [4, 5, 3, 6, 2, 7, 1, 0];

    var dx = link.x2 - link.x1;
    var dy = link.y2 - link.y1;

    var chooser = function (i) {
        return used[i] === false;
    };
    var choice;

    if (Math.abs(dx) > Math.abs(dy)) {
        //arrow is more horizontal than vertical
        if (dx < 0) {
            //port on right
            choice = right.find(chooser);
        } else {
            //port on left
            choice = left.find(chooser);
        }
    } else {
        //arrow is more vertical than horizontal
        if (dy < 0) {
            //port on bottom
            choice = bottom.find(chooser);
        } else {
            //port on top
            choice = top.find(chooser);
        }
    }
    return choice;
}

function preprocessConnection32(links) {
    "use strict";
    if (links.length === 0) {
        return;
    }

    var destination = findNode(links[0].dest8, links[0].dest16,
            links[0].dest24, links[0].dest32);

    //
    //    3_2
    //  4|   |1
    //  5|___|0
    //    6 7
    //
    var used = [false, false, false, false, false, false, false, false];
    var locations = [{"x": destination.x + destination.radius, "y": destination.y + destination.radius / 3, "alias": "", "side": "right"},
            {"x": destination.x + destination.radius, "y": destination.y - destination.radius / 3, "alias": "", "side": "right"},
            {"x": destination.x + destination.radius / 3, "y": destination.y - destination.radius, "alias": "", "side": "top"},
            {"x": destination.x - destination.radius / 3, "y": destination.y - destination.radius, "alias": "", "side": "top"},
            {"x": destination.x - destination.radius, "y": destination.y - destination.radius / 3, "alias": "", "side": "left"},
            {"x": destination.x - destination.radius, "y": destination.y + destination.radius / 3, "alias": "", "side": "left"},
            {"x": destination.x - destination.radius / 3, "y": destination.y + destination.radius, "alias": "", "side": "bottom"},
            {"x": destination.x + destination.radius / 3, "y": destination.y + destination.radius, "alias": "", "side": "bottom"}];

    var ports = {};
    var j;
    var choice = 0;
    //the first 8 unique port numbers should be mapped to locations.
    for (j = 0; j < Object.keys(links).length; j += 1) {
        if (ports.hasOwnProperty(links[j].port)) {
            continue;
        }
        port_request_add(links[j].port);
        choice = closestEmptyPort(links[j], used);
        if (choice === undefined) {
            continue;
        }
        ports[links[j].port] = locations[choice];
        used[choice] = true;
        if (Object.keys(ports).length >= 8) {
            break;
        }
    }
    destination.ports = ports;

    links.forEach(function (link) {
        var source = findNode(link.source8, link.source16,
                link.source24, link.source32);

        //offset endpoints by radius
        var dx = link.x2 - link.x1;
        var dy = link.y2 - link.y1;

        if (ports.hasOwnProperty(link.port)) {
            if (ports[link.port].side === "top") {
                link.x2 = ports[link.port].x;
                link.y2 = ports[link.port].y - 0.6;
            } else if (ports[link.port].side === "left") {
                link.x2 = ports[link.port].x - 0.6;
                link.y2 = ports[link.port].y;
            } else if (ports[link.port].side === "right") {
                link.x2 = ports[link.port].x + 0.6;
                link.y2 = ports[link.port].y;
            } else if (ports[link.port].side === "bottom") {
                link.x2 = ports[link.port].x;
                link.y2 = ports[link.port].y + 0.6;
            } else {
                //this should never execute
                link.x2 = ports[link.port].x;
                link.y2 = ports[link.port].y;
            }
        } else {
            //align to corners
            if (dx > 0) {
                link.x1 += source.radius;
                link.x2 -= destination.radius;
            } else {
                link.x1 -= source.radius;
                link.x2 += destination.radius;
            }
            if (dy > 0) {
                link.y1 += source.radius;
                link.y2 -= destination.radius;
            } else {
                link.y1 -= source.radius;
                link.y2 += destination.radius;
            }
        }
    });
}

function preprocessConnection(link) {
    "use strict";
    //TODO: move this preprocessing into the database (preprocess.py) instead of client-side.
    var source = {};
    var destination = {};
    if (link.hasOwnProperty("source32")) {
        source = findNode(link.source8, link.source16, link.source24, link.source32);
        destination = findNode(link.dest8, link.dest16, link.dest24, link.dest32);
    } else if (link.hasOwnProperty("source24")) {
        source = findNode(link.source8, link.source16, link.source24);
        destination = findNode(link.dest8, link.dest16, link.dest24);
    } else if (link.hasOwnProperty("source16")) {
        destination = findNode(link.dest8, link.dest16);
        source = findNode(link.source8, link.source16);
    } else {
        destination = findNode(link.dest8);
        source = findNode(link.source8);
    }

    var dx = link.x2 - link.x1;
    var dy = link.y2 - link.y1;

    if (Math.abs(dx) > Math.abs(dy)) {
        //arrow is more horizontal than vertical
        if (dx < 0) {
            //leftward flowing
            link.x1 -= source.radius;
            link.x2 += destination.radius;
            link.y1 += source.radius * 0.2;
            link.y2 += destination.radius * 0.2;
        } else {
            //rightward flowing
            link.x1 += source.radius;
            link.x2 -= destination.radius;
            link.y1 -= source.radius * 0.2;
            link.y2 -= destination.radius * 0.2;
        }
    } else {
        //arrow is more vertical than horizontal
        if (dy < 0) {
            //upward flowing
            link.y1 -= source.radius;
            link.y2 += destination.radius;
            link.x1 += source.radius * 0.2;
            link.x2 += destination.radius * 0.2;
        } else {
            //downward flowing
            link.y1 += source.radius;
            link.y2 -= destination.radius;
            link.x1 -= source.radius * 0.2;
            link.x2 -= destination.radius * 0.2;
        }
    }
}

function onLoadData(result) {
    "use strict";
    // result should be an array of objects
    // where each object has address, alias, connections, x, y, radius,
    nodeCollection = {};
    result.forEach(function (node) {
        var name = node.address;
        nodeCollection[node.address] = new Node(node.alias, name, node.address, 8, node.connections, node.x, node.y, node.radius, node.inputs, node.outputs);
    });

    Object.keys(nodeCollection).forEach(function (key) {
        nodeCollection[key].inputs.forEach(preprocessConnection);
        nodeCollection[key].outputs.forEach(preprocessConnection);
    });

    resetViewport(nodeCollection);
    updateRenderRoot();
    render(tx, ty, scale);
}

// Function(jqXHR jqXHR, String textStatus, String errorThrown)
function onNotLoadData(xhr, textStatus, errorThrown) {
    "use strict";
    console.log("Failed to load data:");
    console.log("\t" + textStatus);
    console.log("\t" + errorThrown);
}

function loadData() {
    "use strict";
    $.ajax({
        url: "/query",
        data: {"filter": filter},
        success: onLoadData,
        error: onNotLoadData
    });
}

function loadChildren(parent, callback) {
    "use strict";
    if (parent.childrenLoaded === true) {
        return;
    }

    parent.childrenLoaded = true;
    //console.log("Loading children of " + node.address);
    var temp = parent.address.split(".");
    var requestData = {"ip24": -1, "ip16": -1, "ip8": -1};
    if (temp.length >= 3) {
        requestData.ip24 = temp[2];
    }
    if (temp.length >= 2) {
        requestData.ip16 = temp[1];
    }
    if (temp.length >= 1) {
        requestData.ip8 = temp[0];
    }
    requestData.filter = filter;

    $.ajax({
        url: "/query",
        type: "GET",
        data: requestData,
        dataType: "json",
        error: onNotLoadData,
        success: function (result) {
            // result should be an array of objects
            // where each object has address, alias, connections, x, y, radius,
            result.forEach(function (child) {
                var name = parent.address + "." + child.address;
                parent.children[child.address] = new Node(child.alias, name, child.address, parent.level + 8, child.connections, child.x, child.y, child.radius, child.inputs, child.outputs);
            });
            // process the connections
            Object.keys(parent.children).forEach(function (child) {
                if (parent.children[child].level === 32) {
                    preprocessConnection32(parent.children[child].inputs);
                } else {
                    parent.children[child].inputs.forEach(preprocessConnection);
                }
                parent.children[child].outputs.forEach(preprocessConnection);
            });
            port_request_submit();

            if (typeof callback === "function") {
                callback();
            } else {
                updateRenderRoot();
                render(tx, ty, scale);
            }
        }
    });
}

function POST_node_alias(node, name) {
    "use strict";
    var request = {"node": node.address, "alias": name}
    $.ajax({
        url: "/nodeinfo",
        type: "POST",
        data: request,
        error: onNotLoadData,
        success: function (response) { console.log(response); }
    });
}

function POST_portinfo(request) {
    "use strict";
    $.ajax({
        url: "/portinfo",
        type: "POST",
        data: request,
        error: onNotLoadData
    });
}

function GET_portinfo(port) {
    "use strict";
    var requestData = {"port": port.join(",")};
    $.ajax({
        url: "/portinfo",
        type: "GET",
        data: requestData,
        dataType: "json",
        error: onNotLoadData,
        success: GET_portinfo_callback
    });
}

function checkLoD() {
    "use strict";
    var visible = onScreen();

    visible.forEach(function (node) {
        if (node.level < currentLevel()) {
            loadChildren(node);
        }
    });
    updateRenderRoot();
    render(tx, ty, scale);
}

function getDetails(node, callback) {
    "use strict";
    var temp = node.address.split(".");
    var requestData = {"ip32": -1, "ip24": -1, "ip16": -1, "ip8": -1};
    if (temp.length >= 4) {
        requestData.ip32 = temp[3];
    }
    if (temp.length >= 3) {
        requestData.ip24 = temp[2];
    }
    if (temp.length >= 2) {
        requestData.ip16 = temp[1];
    }
    if (temp.length >= 1) {
        requestData.ip8 = temp[0];
    }

    $.ajax({
        url: "/details",
        //dataType: "json",
        type: "GET",
        data: requestData,
        error: onNotLoadData,
        success: function (result) {
            node.details["unique_in"] = result.unique_in;
            node.details["unique_out"] = result.unique_out;
            node.details["unique_ports"] = result.unique_ports;
            node.details["conn_in"] = result.conn_in;
            node.details["conn_out"] = result.conn_out;
            node.details["ports_in"] = result.ports_in;
            node.details["loaded"] = true;

            result.conn_in.forEach(function (element) {
                element[1].forEach(function (port) {
                    port_request_add(port.port);
                });
            });
            result.conn_out.forEach(function (element) {
                element[1].forEach(function (port) {
                    port_request_add(port.port);
                });
            });
            result.ports_in.forEach(function (element) {
                port_request_add(element.port);
            });
            port_request_submit();

            if (typeof callback === "function") {
                callback();
            }
        }
    });
}