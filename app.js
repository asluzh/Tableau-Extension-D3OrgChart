// "use strict";
(function () {
  // var unregisterSettingsEventListener;
  var unregisterFilterEventListener;
  var savedSourceSheet;
  var savedFieldNodeId;
  var savedFieldParentId;
  var savedFieldFullName;
  var savedFieldOrgUnit;
  var savedFieldPosition;
  var savedFieldPicture;
  var savedFieldLocation1;
  var savedFieldLocation2;
  var savedDefaultPicture;
  var savedTargetSheet;
  var savedTargetFilter;
  var worksheet;
  var targetWorksheet;
  var parameterSelect;
  var targetFilter;
  // "https://10ax.online.tableau.com/img/user_content_type.svg"

  $(document).ready(function () {
    tableau.extensions.initializeAsync({ configure: configure }).then(
      function () {
        getSettings();
        renderGraph();
        // unregisterSettingsEventListener =
        tableau.extensions.settings.addEventListener(
          tableau.TableauEventType.SettingsChanged,
          function () {
            console.log("settings changed");
            getSettings();
            renderGraph();
          }
        );
      },
      function () {
        console.log("Error while Initializing: " + err.toString());
      }
    );
  });

  function getSettings() {
    savedSourceSheet = tableau.extensions.settings.get("source_sheet");
    savedFieldNodeId = tableau.extensions.settings.get("field_node_id");
    savedFieldParentId = tableau.extensions.settings.get("field_parent_id");
    savedFieldFullName = tableau.extensions.settings.get("field_full_name");
    savedFieldOrgUnit = tableau.extensions.settings.get("field_org_unit");
    savedFieldPosition = tableau.extensions.settings.get("field_position");
    savedFieldPicture = tableau.extensions.settings.get("field_picture");
    savedFieldLocation1 = tableau.extensions.settings.get("field_location1");
    savedFieldLocation2 = tableau.extensions.settings.get("field_location2");
    savedDefaultPicture = tableau.extensions.settings.get("default_picture");
    savedPictureUrlTemplate = tableau.extensions.settings.get("picture_url_template");
    savedTargetSheet = tableau.extensions.settings.get("target_sheet");
    savedTargetFilter = tableau.extensions.settings.get("target_filter");
    if (unregisterFilterEventListener) {
      unregisterFilterEventListener();
    }
    worksheet = getSelectedSheet(savedSourceSheet);
    tableau.extensions.dashboardContent.dashboard.getParametersAsync().then(function (parameters) {
      parameters.forEach(function (p) {
        if (p.name == "SelectEmployee") {
          parameterSelect = p;
        }
      });
    });
    targetWorksheet = getSelectedSheet(savedTargetSheet);
    if (targetWorksheet) {
      targetWorksheet.getFiltersAsync().then(function (filters) {
        filters.forEach(function (f) {
          if (f.fieldName == savedTargetFilter) {
            targetFilter = f.fieldName;
            // console.log(targetFilter);
          }
        });
      });
    }
    // unregisterFilterEventListener = inputWsEdges.addEventListener(
    //   tableau.TableauEventType.FilterChanged,
    //   function () {
    //     console.log("FilterChanged");
    //     renderGraph();
    //   }
    // );
  }

  function configure() {
    console.log(window.location);
    let popupUrl = window.location.origin + "/configure.html";
    // console.log(popupUrl);
    tableau.extensions.ui
      .displayDialogAsync(popupUrl, "Payload Message", {
        height: 600,
        width: 500,
      })
      .then(function (closePayLoad) {
        // if (!tableau.extensions.settings.get("source_sheet")) {
        //   console.log("Nodes worksheet was NOT selected");
        // } else {
        //   console.log("Nodes worksheet was selected");
        // }
      })
      .catch(function (error) {
        switch (error.errorCode) {
          case tableau.ErrorCodes.DialogClosedByUser:
            console.log("Dialog was closed by user");
            break;
          default:
            console.error(error.message);
        }
      });
  }

  function getSelectedSheet(worksheetName) {
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
      return sheet.name === worksheetName;
    });
  }

  function getFieldIndex(dataTable, fieldName) {
    if (dataTable.columns.length > 0) {
      return dataTable.columns.find(function (column) {
        return column.fieldName === fieldName;
      }).index;
    } else {
      return 0;
    }
  }

  function getGraphData(dataTable) {
    let node_id_idx = getFieldIndex(dataTable, savedFieldNodeId);
    let parent_id_idx = getFieldIndex(dataTable, savedFieldParentId);
    // console.log(node_id_idx);
    // console.log(parent_id_idx);
    // console.log(dataTable);
    let hashTable = Object.create(null);
    dataTable.data.forEach(function (row) {
      let node = row[node_id_idx].value;
      hashTable[node] = Object.create(null);
      for (i = 0; i < dataTable.columns.length; i++) {
        if (i != parent_id_idx) {
          // i != node_id_idx &&
          hashTable[node][dataTable.columns[i].fieldName] = row[i].value;
        }
      }
    });
    // console.log(hashTable);
    var treeData = [];
    dataTable.data.forEach(function (row) {
      let node = row[node_id_idx].value;
      let parent = row[parent_id_idx].value;
      if (parent && hashTable[parent]) {
        (hashTable[parent].children || (hashTable[parent].children = [])).push(hashTable[node]);
      } else {
        treeData.push(hashTable[node]);
      }
    });
    // console.log(hashTable);
    if (treeData.length > 0) {
      return treeData[0];
    }
  }

  function renderGraph() {
    if (savedSourceSheet && savedFieldNodeId && savedFieldParentId && savedFieldFullName) {
      $("#pleaseconfigure").hide();
      worksheet.getSummaryDataAsync().then(function (dataTableNodes) {
        // console.log(dataTableNodes, dataTableEdges);
        var data = getGraphData(dataTableNodes);
        // console.log(data);
        // return;
        // $("#graph-container").empty();

        var params = {
          selector: "#graph-container",
          chartWidth: window.innerWidth - 18, // - 40
          chartHeight: window.innerHeight - 20, // - 40
          funcs: {
            expandAll: null,
            // search: null,
            // closeSearchBox: null,
            // clearResult: null,
            // reflectResults: null,
            // findInTree: null,
            // departmentClick: null,
            // back: null,
            locate: null,
          },
          data: null,
        };

        params.data = data;
        params.pristinaData = JSON.parse(JSON.stringify(data));

        params.funcs.expandAll = expandAll;
        // params.funcs.search = searchUsers;
        // params.funcs.closeSearchBox = closeSearchBox;
        // params.funcs.clearResult = clearResult;
        // params.funcs.reflectResults = reflectResults;
        // params.funcs.findInTree = findInTree;
        // params.funcs.departmentClick = departmentClick;
        // params.funcs.back = back;
        params.funcs.locate = locate;

        var attrs = {
          EXPAND_SYMBOL: "\uf067",
          COLLAPSE_SYMBOL: "\uf068",
          selector: params.selector,
          root: params.data,
          width: params.chartWidth,
          height: params.chartHeight,
          index: 0,
          nodePadding: 9,
          collapseCircleRadius: 7,
          nodeHeight: 80,
          nodeWidth: 210,
          duration: 750,
          rootNodeTopMargin: 20,
          minMaxZoomProportions: [0.05, 3],
          linkLineSize: 180,
          collapsibleFontSize: "10px",
          userIcon: "\uf007",
          nodeStroke: "#ccc",
          nodeStrokeWidth: "1px",
        };

        var dynamic = {};
        dynamic.nodeImageWidth = (attrs.nodeHeight * 100) / 140;
        dynamic.nodeImageHeight = attrs.nodeHeight - 2 * attrs.nodePadding;
        dynamic.nodeTextLeftMargin = attrs.nodePadding * 2 + dynamic.nodeImageWidth;
        dynamic.rootNodeLeftMargin = attrs.width / 2;
        dynamic.nodePositionNameTopMargin =
          attrs.nodePadding + 8 + (dynamic.nodeImageHeight / 4) * 1;
        dynamic.nodeChildCountTopMargin =
          attrs.nodePadding + 14 + (dynamic.nodeImageHeight / 4) * 3;

        var tree = d3.layout.tree().nodeSize([attrs.nodeWidth + 40, attrs.nodeHeight]);
        var diagonal = d3.svg.diagonal().projection(function (d) {
          // debugger;
          return [d.x + attrs.nodeWidth / 2, d.y + attrs.nodeHeight / 2];
        });

        var zoomBehaviours = d3.behavior
          .zoom()
          .scaleExtent(attrs.minMaxZoomProportions)
          .on("zoom", redraw);

        var svg = d3
          .select(attrs.selector)
          .html(null)
          .append("svg")
          .attr("width", attrs.width)
          .attr("height", attrs.height)
          .call(zoomBehaviours)
          .append("g")
          .attr("transform", "translate(" + attrs.width / 2 + "," + 20 + ")");

        d3.select(attrs.selector).select("svg").on("dblclick.zoom", null); // disable zoom on double click
        //necessary so that zoom knows where to zoom and unzoom from
        zoomBehaviours.translate([dynamic.rootNodeLeftMargin, attrs.rootNodeTopMargin]);

        attrs.root.x0 = 0;
        attrs.root.y0 = dynamic.rootNodeLeftMargin;

        if (params.mode != "department") {
          // adding unique values to each node recursively
          var uniq = 1;
          addPropertyRecursive(
            "uniqueIdentifier",
            function (v) {
              return uniq++;
            },
            attrs.root
          );
        }

        expand(attrs.root);
        if (attrs.root.children) {
          attrs.root.children.forEach(collapse);
        }

        update(attrs.root);

        d3.select(attrs.selector).style("height", attrs.height);

        var tooltip = d3.select("body").append("div").attr("class", "customTooltip-wrapper");

        function update(source, param) {
          // Compute the new tree layout.
          var nodes = tree.nodes(attrs.root).reverse(),
            links = tree.links(nodes);

          // Normalize for fixed-depth.
          nodes.forEach(function (d) {
            d.y = d.depth * attrs.linkLineSize;
          });

          // Update the nodes…
          var node = svg.selectAll("g.node").data(nodes, function (d) {
            return d.id || (d.id = ++attrs.index);
          });

          // Enter any new nodes at the parent's previous position.
          var nodeEnter = node
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
              return "translate(" + source.x0 + "," + source.y0 + ")";
            });

          var nodeGroup = nodeEnter.append("g").attr("class", "node-group");

          nodeGroup
            .append("rect")
            .attr("width", attrs.nodeWidth)
            .attr("height", attrs.nodeHeight)
            .attr("data-node-group-id", function (d) {
              return d.uniqueIdentifier;
            })
            .attr("class", function (d) {
              var res = "";
              if (d.isLoggedUser) res += "nodeRepresentsCurrentUser ";
              res += d._children || d.children ? "nodeHasChildren" : "nodeDoesNotHaveChildren";
              return res;
            });

          var collapsiblesWrapper = nodeEnter.append("g").attr("data-id", function (v) {
            return v.uniqueIdentifier;
          });

          var collapsibleRects = collapsiblesWrapper
            .append("rect")
            .attr("class", "node-collapse-right-rect")
            .attr("height", attrs.collapseCircleRadius)
            .attr("fill", "black")
            .attr("x", attrs.nodeWidth - attrs.collapseCircleRadius)
            .attr("y", attrs.nodeHeight - 7)
            .attr("width", function (d) {
              if (d.children || d._children) return attrs.collapseCircleRadius;
              return 0;
            });

          var collapsibles = collapsiblesWrapper
            .append("circle")
            .attr("class", "node-collapse")
            .attr("cx", attrs.nodeWidth - attrs.collapseCircleRadius)
            .attr("cy", attrs.nodeHeight - 7)
            .attr("", setCollapsibleSymbolProperty);

          //hide collapse rect when node does not have children
          collapsibles
            .attr("r", function (d) {
              if (d.children || d._children) return attrs.collapseCircleRadius;
              return 0;
            })
            .attr("height", attrs.collapseCircleRadius);

          collapsiblesWrapper
            .append("text")
            .attr("class", "text-collapse")
            .attr("x", attrs.nodeWidth - attrs.collapseCircleRadius)
            .attr("y", attrs.nodeHeight - 3)
            .attr("width", attrs.collapseCircleRadius)
            .attr("height", attrs.collapseCircleRadius)
            .style("font-size", attrs.collapsibleFontSize)
            .attr("text-anchor", "middle")
            .style("font-family", "FontAwesome")
            .text(function (d) {
              return d.collapseText;
            });

          collapsiblesWrapper.on("click", click);

          nodeGroup
            .append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", attrs.nodePadding + 10)
            .attr("class", "emp-name")
            .attr("text-anchor", "left")
            .text(function (d) {
              return savedFieldFullName ? d[savedFieldFullName].trim() : "";
            })
            .call(wrap, attrs.nodeWidth);

          nodeGroup
            .append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", dynamic.nodePositionNameTopMargin)
            .attr("class", "emp-position")
            .attr("dy", ".35em")
            .attr("text-anchor", "left")
            .text(function (d) {
              if (savedFieldPosition) {
                var position = d[savedFieldPosition].substring(0, 27);
                if (position.length < d[savedFieldPosition].length) {
                  position = position.substring(0, 24) + "...";
                }
                return position;
              } else {
                return "";
              }
            });

          nodeGroup
            .append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", attrs.nodePadding + 10 + (dynamic.nodeImageHeight / 4) * 2)
            .attr("class", "emp-unit")
            .attr("dy", ".35em")
            .attr("text-anchor", "left")

            .text(function (d) {
              return savedFieldOrgUnit ? d[savedFieldOrgUnit] : "";
            });

          nodeGroup
            .append("text")
            .attr("x", dynamic.nodeTextLeftMargin)
            .attr("y", dynamic.nodeChildCountTopMargin)
            .attr("class", "emp-count-icon")
            .attr("text-anchor", "left")
            .style("font-family", "FontAwesome")
            .text(function (d) {
              if (d.children || d._children) return attrs.userIcon;
            });

          nodeGroup
            .append("text")
            .attr("x", dynamic.nodeTextLeftMargin + 13)
            .attr("y", dynamic.nodeChildCountTopMargin)
            .attr("class", "emp-count")
            .attr("text-anchor", "left")

            .text(function (d) {
              if (d.children) return d.children.length;
              if (d._children) return d._children.length;
              return;
            });

          nodeGroup
            .append("defs")
            .append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("id", "clip-rect")
            .attr("rx", 3)
            .attr("x", attrs.nodePadding)
            .attr("y", 2 + attrs.nodePadding)
            .attr("width", dynamic.nodeImageWidth)
            .attr("fill", "none")
            .attr("height", dynamic.nodeImageHeight - 4);

          nodeGroup
            .append("svg:image")
            .attr("y", 2 + attrs.nodePadding)
            .attr("x", attrs.nodePadding)
            .attr("preserveAspectRatio", "xMidYMin slice") // "none"
            .attr("width", dynamic.nodeImageWidth)
            .attr("height", dynamic.nodeImageHeight - 4)
            .attr("clip-path", "url(#clip)")
            .attr("xlink:href", function (d) {
              if (savedFieldPicture) return d[savedFieldPicture];
              if (savedPictureUrlTemplate) {
                return savedPictureUrlTemplate.replace(/\{\{(.*?)\}\}/g, function (match, token) {
                  return d[token];
                });
              }
              return savedDefaultPicture;
            })
            .on("error", function () {
              d3.select(this).attr("xlink:href", function (d) {
                return savedDefaultPicture;
              });
            });

          // Transition nodes to their new position.
          var nodeUpdate = node
            .transition()
            .duration(attrs.duration)
            .attr("transform", function (d) {
              return "translate(" + d.x + "," + d.y + ")";
            });

          //todo replace with attrs object
          nodeUpdate
            .select("rect")
            .attr("width", attrs.nodeWidth)
            .attr("height", attrs.nodeHeight)
            .attr("rx", 3)
            .attr("stroke", function (d) {
              if (param && d.uniqueIdentifier == param.locate) {
                return "#a1ceed";
              }
              return attrs.nodeStroke;
            })
            .attr("stroke-width", function (d) {
              if (param && d.uniqueIdentifier == param.locate) {
                return 6;
              }
              return attrs.nodeStrokeWidth;
            });

          // Transition exiting nodes to the parent's new position.
          var nodeExit = node
            .exit()
            .transition()
            .duration(attrs.duration)
            .attr("transform", function (d) {
              return "translate(" + source.x + "," + source.y + ")";
            })
            .remove();

          nodeExit.select("rect").attr("width", attrs.nodeWidth).attr("height", attrs.nodeHeight);

          // Update the links…
          var link = svg.selectAll("path.link").data(links, function (d) {
            return d.target.id;
          });

          // Enter any new links at the parent's previous position.
          link
            .enter()
            .insert("path", "g")
            .attr("class", "link")
            .attr("x", attrs.nodeWidth / 2)
            .attr("y", attrs.nodeHeight / 2)
            .attr("d", function (d) {
              var o = {
                x: source.x0,
                y: source.y0,
              };
              return diagonal({
                source: o,
                target: o,
              });
            });

          // Transition links to their new position.
          link.transition().duration(attrs.duration).attr("d", diagonal);

          // Transition exiting nodes to the parent's new position.
          link
            .exit()
            .transition()
            .duration(attrs.duration)
            .attr("d", function (d) {
              var o = {
                x: source.x,
                y: source.y,
              };
              return diagonal({
                source: o,
                target: o,
              });
            })
            .remove();

          // Stash the old positions for transition.
          nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
          });

          // if (param && param.locate) {
          //   var x;
          //   var y;

          //   nodes.forEach(function (d) {
          //     if (d.uniqueIdentifier == param.locate) {
          //       x = d.x;
          //       y = d.y;
          //     }
          //   });

          //   // normalize for width/height
          //   var new_x = -x + window.innerWidth / 2;
          //   var new_y = -y + window.innerHeight / 2;

          //   // move the main container g
          //   svg.attr("transform", "translate(" + new_x + "," + new_y + ")");
          //   zoomBehaviours.translate([new_x, new_y]);
          //   zoomBehaviours.scale(1);
          // }

          // if (param && param.centerMySelf) {
          //   var x;
          //   var y;

          //   nodes.forEach(function (d) {
          //     if (d.isLoggedUser) {
          //       x = d.x;
          //       y = d.y;
          //     }
          //   });

          //   // normalize for width/height
          //   var new_x = -x + window.innerWidth / 2;
          //   var new_y = -y + window.innerHeight / 2;

          //   // move the main container g
          //   svg.attr("transform", "translate(" + new_x + "," + new_y + ")");
          //   zoomBehaviours.translate([new_x, new_y]);
          //   zoomBehaviours.scale(1);
          // }

          /*################  TOOLTIP  #############################*/

          // function getTagsFromCommaSeparatedStrings(tags) {
          //   return tags
          //     .split(",")
          //     .map(function (v) {
          //       return '<li><div class="tag">' + v + "</div></li>  ";
          //     })
          //     .join("");
          // }

          function tooltipContent(item) {
            var strVar = "";

            strVar += '  <div class="customTooltip">';
            strVar +=
              '    <div class="profile-image-wrapper" style=\'background-image: url(' +
              (savedFieldPicture
                ? item[savedFieldPicture]
                : savedPictureUrlTemplate
                ? savedPictureUrlTemplate.replace(/\{\{(.*?)\}\}/g, function (match, token) {
                    return item[token];
                  })
                : savedDefaultPicture) +
              "), url(" +
              savedDefaultPicture + // second url: default picture, if specified is not found
              ")'>";
            strVar += "    </div>";
            strVar += '    <div class="tooltip-hr"></div>';
            strVar += '    <div class="tooltip-desc">';
            strVar +=
              '      <a class="emp-name" href=\'' +
              item.profileUrl +
              '\' target="_blank"> ' +
              (savedFieldFullName ? item[savedFieldFullName].trim() : "") +
              "</a>";
            strVar +=
              '      <p class="emp-position">' +
              (savedFieldPosition ? item[savedFieldPosition] : "") +
              " </p>";
            strVar +=
              '      <p class="emp-unit">' +
              (savedFieldOrgUnit ? item[savedFieldOrgUnit] : "") +
              " </p>";
            strVar +=
              '      <p class="emp-location">' +
              (savedFieldLocation1 ? item[savedFieldLocation1] : "") +
              (savedFieldLocation2 ? ", " + item[savedFieldLocation2] : "") +
              " </p>";
            // strVar += "";
            // strVar += '      <p class="office">' + item.office + "</p>";
            // strVar +=
            //   "     <button class='disabled btn btn-tooltip-department' onclick='params.funcs.departmentClick(" +
            //   JSON.stringify(item.unit) +
            //   ")'>" +
            //   item.unit +
            //   "</button>";
            // strVar +=
            //   '      <h4 class="tags-wrapper">             <span class="title"><i class="fa fa-tags" aria-hidden="true"></i>';
            // strVar += "        ";
            // strVar +=
            //   '        </span>           <ul class="tags">' +
            //   getTagsFromCommaSeparatedStrings(item.tags) +
            //   "</ul>         </h4>";
            strVar += "    </div>"; // end of div class="tooltip-desc"
            strVar += '  <div class="bottom-tooltip-hr"></div>';
            strVar += "  </div>"; // end of div class="customTooltip"
            strVar += "";

            return strVar;
          }

          function errorLoadingPicture() {
            console.log("error occur");
          }

          function tooltipHoverHandler(d) {
            // console.log(d);
            var content = tooltipContent(d);
            tooltip.html(content);
            // tooltip.select(".profile-image-wrapper").attr("onerror", "errorLoadingPicture()");
            // function () {
            // d3.select(this).attr("xlink:href", function (d) {
            //   return savedDefaultPicture;
            // });
            // });
            // console.log(tooltip.select(".profile-image-wrapper"));

            tooltip.transition().duration(200).style("opacity", "1").style("display", "block");
            d3.select(this).attr("cursor", "pointer").attr("stroke-width", 50);

            var y = d3.event.pageY;
            var x = d3.event.pageX;

            //restrict tooltip to fit in borders
            if (y < 220) {
              y += 220 - y;
              x += 130;
            }

            if (y > attrs.height - 300) {
              y -= 300 - (attrs.height - y);
            }

            tooltip.style("top", y - 300 + "px").style("left", x - 470 + "px");
          }

          // function tooltipOutHandler() {
          //   tooltip.transition().duration(200).style("opacity", "0").style("display", "none");
          //   d3.select(this).attr("stroke-width", 5);
          // }

          function nodeSelectHandler(d) {
            // console.log(d);
            if (parameterSelect) {
              parameterSelect.changeValueAsync(d[savedFieldNodeId]);
            }
            if (targetWorksheet && targetFilter) {
              var subtreeIds = [];
              function addSubtreeIds(d) {
                subtreeIds.push(d[savedFieldNodeId]);
                if (d.children) {
                  d.children.forEach(addSubtreeIds);
                }
                if (d._children) {
                  d._children.forEach(addSubtreeIds);
                }
              }
              addSubtreeIds(d);
              targetWorksheet.applyFilterAsync(targetFilter, subtreeIds, "replace");
            }
            // locate(d.id); // todo: needs debugging, watch collapse action when used (collapses to root nodes)
          }

          // nodeGroup.on("click", tooltipHoverHandler);
          // nodeGroup.on("dblclick", tooltipOutHandler);
          nodeGroup.on("contextmenu", function (d) {
            // right-clicking, first disable browser menu
            d3.event.preventDefault();
            // console.log("right-click");
            tooltipHoverHandler.call(this, d);
          });
          nodeGroup.on("click", nodeSelectHandler);

          function equalToEventTarget() {
            return this == d3.event.target;
          }

          d3.select("body").on("click", function () {
            var outside = tooltip.filter(equalToEventTarget).empty();
            if (outside) {
              tooltip.style("opacity", "0").style("display", "none");
            }
          });
        }

        // Toggle children on click.
        function click(d) {
          d3.select(this)
            .select("text")
            .text(function (dv) {
              if (dv.collapseText == attrs.EXPAND_SYMBOL) {
                dv.collapseText = attrs.COLLAPSE_SYMBOL;
              } else {
                if (dv.children) {
                  dv.collapseText = attrs.EXPAND_SYMBOL;
                }
              }
              return dv.collapseText;
            });

          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update(d);
        }

        //########################################################

        //Redraw for zoom
        function redraw() {
          //console.log("here", d3.event.translate, d3.event.scale);
          svg.attr(
            "transform",
            "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")"
          );
        }

        // #############################   Function Area #######################
        function wrap(text, width) {
          text.each(function () {
            var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 1.1, // ems
              x = text.attr("x"),
              y = text.attr("y"),
              dy = 0, //parseFloat(text.attr("dy")),
              tspan = text
                .text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");
            while ((word = words.pop())) {
              line.push(word);
              tspan.text(line.join(" "));
              if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text
                  .append("tspan")
                  .attr("x", x)
                  .attr("y", y)
                  .attr("dy", ++lineNumber * lineHeight + dy + "em")
                  .text(word);
              }
            }
          });
        }

        function addPropertyRecursive(propertyName, propertyValueFunction, element) {
          if (element[propertyName]) {
            element[propertyName] = element[propertyName] + " " + propertyValueFunction(element);
          } else {
            element[propertyName] = propertyValueFunction(element);
          }
          if (element.children) {
            element.children.forEach(function (v) {
              addPropertyRecursive(propertyName, propertyValueFunction, v);
            });
          }
          if (element._children) {
            element._children.forEach(function (v) {
              addPropertyRecursive(propertyName, propertyValueFunction, v);
            });
          }
        }

        // function departmentClick(item) {
        //   hide([".customTooltip-wrapper"]);

        //   if (item.type == "department" && params.mode != "department") {
        //     //find third level department head user
        //     var found = false;
        //     var secondLevelChildren = params.pristinaData.children;
        //     parentLoop: for (var i = 0; i < secondLevelChildren.length; i++) {
        //       var secondLevelChild = secondLevelChildren[i];
        //       var thirdLevelChildren = secondLevelChild.children
        //         ? secondLevelChild.children
        //         : secondLevelChild._children;

        //       for (var j = 0; j < thirdLevelChildren.length; j++) {
        //         var thirdLevelChild = thirdLevelChildren[j];
        //         if (thirdLevelChild.unit.trim() == item.value.trim()) {
        //           clear(params.selector);

        //           hide([".btn-action"]);
        //           show([".btn-action.btn-back", ".department-information"]);
        //           set(".dept-name", item.value);

        //           // set(
        //           //   ".dept-emp-count",
        //           //   "Employees Quantity - " + getEmployeesCount(thirdLevelChild)
        //           // );
        //           // set(".dept-description", thirdLevelChild.unit.desc);

        //           params.oldData = params.data;

        //           params.data = deepClone(thirdLevelChild);
        //           found = true;
        //           break parentLoop;
        //         }
        //       }
        //     }
        //     if (found) {
        //       params.mode = "department";
        //       params.funcs.closeSearchBox();
        //       renderGraph();
        //     }
        //   }
        // }

        // function getEmployeesCount(node) {
        //   var count = 1;
        //   countChilds(node);
        //   return count;

        //   function countChilds(node) {
        //     var childs = node.children ? node.children : node._children;
        //     if (childs) {
        //       childs.forEach(function (v) {
        //         count++;
        //         countChilds(v);
        //       });
        //     }
        //   }
        // }

        // function reflectResults(results) {
        //   var htmlStringArray = results.map(function (result) {
        //     var strVar = "";
        //     strVar += '         <div class="list-item">';
        //     strVar += "          <a >";
        //     strVar += '            <div class="image-wrapper">';
        //     strVar += '              <img class="image" src="' + result.imageUrl + '"/>';
        //     strVar += "            </div>";
        //     strVar += '            <div class="description">';
        //     strVar += '              <p class="emp-name">' + result.name + "</p>";
        //     strVar +=
        //       '               <p class="emp-position">' +
        //       (savedFieldPosition ? result[savedFieldPosition] : "") +
        //       "</p>";
        //     strVar +=
        //       '               <p class="emp-unit">' +
        //       (savedFieldOrgUnit ? result[savedFieldOrgUnit] : "") +
        //       "</p>";
        //     strVar += "            </div>";
        //     strVar += '            <div class="buttons">';
        //     strVar +=
        //       "              <a target='_blank' href='" +
        //       result.profileUrl +
        //       "'><button class='btn-search-box btn-action'>View Profile</button></a>";
        //     strVar +=
        //       "              <button class='btn-search-box btn-action btn-locate' onclick='params.funcs.locate(" +
        //       result.uniqueIdentifier +
        //       ")'>Locate </button>";
        //     strVar += "            </div>";
        //     strVar += "          </a>";
        //     strVar += "        </div>";

        //     return strVar;
        //   });

        //   var htmlString = htmlStringArray.join("");
        //   params.funcs.clearResult();

        //   var parentElement = get(".result-list");
        //   var old = parentElement.innerHTML;
        //   var newElement = htmlString + old;
        //   parentElement.innerHTML = newElement;
        //   set(".user-search-box .result-header", "RESULT - " + htmlStringArray.length);
        // }

        // function clearResult() {
        //   set(".result-list", '<div class="buffer" ></div>');
        //   set(".user-search-box .result-header", "RESULT");
        // }

        // function listen() {
        //   var input = get(".user-search-box .search-input");

        //   input.addEventListener("input", function () {
        //     var value = input.value ? input.value.trim() : "";
        //     if (value.length < 3) {
        //       params.funcs.clearResult();
        //     } else {
        //       var searchResult = params.funcs.findInTree(params.data, value);
        //       params.funcs.reflectResults(searchResult);
        //     }
        //   });
        // }

        // function searchUsers() {
        //   d3.selectAll(".user-search-box").transition().duration(250).style("width", "350px");
        // }

        // function closeSearchBox() {
        //   d3.selectAll(".user-search-box")
        //     .transition()
        //     .duration(250)
        //     .style("width", "0px")
        //     .each("end", function () {
        //       params.funcs.clearResult();
        //       clear(".search-input");
        //     });
        // }

        // function findInTree(rootElement, searchText) {
        //   var result = [];
        //   // use regex to achieve case insensitive search and avoid string creation using toLowerCase method
        //   var regexSearchWord = new RegExp(searchText, "i");

        //   recursivelyFindIn(rootElement, searchText);

        //   return result;

        //   function recursivelyFindIn(user) {
        //     if (user.name.match(regexSearchWord) || user.tags.match(regexSearchWord)) {
        //       result.push(user);
        //     }

        //     var childUsers = user.children ? user.children : user._children;
        //     if (childUsers) {
        //       childUsers.forEach(function (childUser) {
        //         recursivelyFindIn(childUser, searchText);
        //       });
        //     }
        //   }
        // }

        // function back() {
        //   show([".btn-action"]);
        //   hide([".customTooltip-wrapper", ".btn-action.btn-back", ".department-information"]);
        //   clear(params.selector);

        //   params.mode = "full";
        //   params.data = deepClone(params.pristinaData);
        //   renderGraph();
        // }

        function expandAll() {
          expand(root);
          update(root);
        }

        function expand(d) {
          if (d.children) {
            d.children.forEach(expand);
          }

          if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
          }

          if (d.children) {
            // if node has children and it's expanded, then  display -
            setToggleSymbol(d, attrs.COLLAPSE_SYMBOL);
          }
        }

        function collapse(d) {
          if (d._children) {
            d._children.forEach(collapse);
          }
          if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
          }

          if (d._children) {
            // if node has children and it's collapsed, then  display +
            setToggleSymbol(d, attrs.EXPAND_SYMBOL);
          }
        }

        function setCollapsibleSymbolProperty(d) {
          if (d._children) {
            d.collapseText = attrs.EXPAND_SYMBOL;
          } else if (d.children) {
            d.collapseText = attrs.COLLAPSE_SYMBOL;
          }
        }

        function setToggleSymbol(d, symbol) {
          d.collapseText = symbol;
          d3.select("*[data-id='" + d.uniqueIdentifier + "']")
            .select("text")
            .text(symbol);
        }

        function locateRecursive(d, id) {
          if (d.uniqueIdentifier == id) {
            expandParents(d);
          } else if (d._children) {
            d._children.forEach(function (ch) {
              ch.parent = d;
              locateRecursive(ch, id);
            });
          } else if (d.children) {
            d.children.forEach(function (ch) {
              ch.parent = d;
              locateRecursive(ch, id);
            });
          }
        }

        /* expand current nodes collapsed parents */
        function expandParents(d) {
          while (d.parent) {
            d = d.parent;
            if (!d.children) {
              d.children = d._children;
              d._children = null;
              setToggleSymbol(d, attrs.COLLAPSE_SYMBOL);
            }
          }
        }

        //locateRecursive
        function locate(id) {
          /* collapse all and expand logged user nodes */
          if (!attrs.root.children) {
            if (!attrs.root.uniqueIdentifier == id) {
              attrs.root.children = attrs.root._children;
            }
          }
          if (attrs.root.children) {
            attrs.root.children.forEach(collapse);
            attrs.root.children.forEach(function (ch) {
              locateRecursive(ch, id);
            });
          }
          update(attrs.root, { locate: id });
        }

        // function deepClone(item) {
        //   return JSON.parse(JSON.stringify(item));
        // }

        // function show(selectors) {
        //   display(selectors, "initial");
        // }

        // function hide(selectors) {
        //   display(selectors, "none");
        // }

        // function display(selectors, displayProp) {
        //   selectors.forEach(function (selector) {
        //     var elements = getAll(selector);
        //     elements.forEach(function (element) {
        //       element.style.display = displayProp;
        //     });
        //   });
        // }

        // function set(selector, value) {
        //   var elements = getAll(selector);
        //   elements.forEach(function (element) {
        //     element.innerHTML = value;
        //     element.value = value;
        //   });
        // }

        // function clear(selector) {
        //   set(selector, "");
        // }

        // function get(selector) {
        //   return document.querySelector(selector);
        // }

        // function getAll(selector) {
        //   return document.querySelectorAll(selector);
        // }
      });
    } else {
      console.log("settings not set");
    }
  }

  // function updateGraph(dataTableNodes, dataTableEdges) {
  //   // console.log("updateGraph");
  //   // console.log(dataTableNodes);
  //   // console.log(dataTableEdges);
  //   if (sigmaInstance) {
  //     var g = getGraphData(dataTableNodes, dataTableEdges);
  //     // sigmaInstance.graph.nodes = g.nodes;
  //     // sigmaInstance.graph.edges = g.edges;
  //     var nodes = sigmaInstance.graph.nodes();
  //     // console.log(nodes);
  //     sigmaInstance.graph.clear();
  //     nodes.forEach(function(node) {
  //       // console.log("looking for node");
  //       var targetnode = g.nodes.filter(function(el) {
  //         return el.id === node.id;
  //       });
  //       // console.log(targetnode);
  //       if (
  //         typeof targetnode === "object" &&
  //         typeof targetnode[0] === "object"
  //       ) {
  //         targetnode[0].x = node.x;
  //         targetnode[0].y = node.y;
  //         targetnode[0].size = node.size;
  //         targetnode[0]._replacedcoords = 1;
  //         // console.log("changed node attrs");
  //       }
  //     });
  //     var newNodes = false;
  //     g.nodes.forEach(function(el) {
  //       if (el._replacedcoords) {
  //         delete el._replacedcoords;
  //       } else {
  //         newNodes = true;
  //       }
  //     });
  //     // console.log(sigmaInstance.cameras[0]);
  //     sigmaInstance.graph.read(g);
  //     sigmaInstance.refresh();
  //     // console.log(sigmaInstance.cameras[0]);
  //     // sigmaInstance.cameras[0].goTo({ x: 0, y: 0, angle: 0, ratio: 1 });
  //     if (newNodes) {
  //       console.log("new nodes update");
  //       tooltips.close();
  //       sigma.layouts.fruchtermanReingold.start(sigmaInstance);
  //     }
  //   }
  // } // end of function updateGraph(dataTableNodes, dataTableEdges)
})();
