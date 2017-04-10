//module for setting up the timeline
var TimelineBuilder = (function() {
    var _timelineLengthInSeconds = 0;
    var _awayTeamActionData = [];
    var _homeTeamActionData = [];
    var _svgContainer = undefined;
    var _xAxisScale = undefined;

    var _homeTeamConfig = {
      teamActionData: _homeTeamActionData,
      teamActionGroupSelector: "g.home-actions",
      teamActionItemClassName: "home-action",
      yPositionOnTimeline: -15,
      itemColor: "blue",
    }

    var _awayTeamConfig = {
      teamActionData: _awayTeamActionData,
      teamActionGroupSelector: "g.away-actions",
      teamActionItemClassName: "away-action",
      yPositionOnTimeline: 15,
      itemColor: "red"
    }

    var _buildTimeline = function() {
        var svgMargins = {
          top: 40,
          right: 10,
          bottom: 40,
          left: 10
        };

        var svgDimensions = {
          width: 800,
          height: 600
        };

        var svgContainer = d3.select(".svg-container")
                              .append("svg")
                                .attr("preserveAspectRatio", "xMinYMin meet")
                                .attr("viewBox", "0 0 " + svgDimensions.width + " " + svgDimensions.height)
                                .attr("class", "timeline-container")
                              .append("g")
                                .attr("transform", "translate(0, " + svgMargins.top + ")");
        _svgContainer = svgContainer;

        //create an x axis scale to map time in seconds with the place on the timeline
        _xAxisScale = d3.scaleLinear()
                                 .domain([1, _timelineLengthInSeconds])
                                 .range([0, 800]);

        var xAxis = d3.axisBottom()
                          .scale(_xAxisScale)
                          .tickSize(9)
                          .tickSizeOuter(0)
                          .tickFormat("");

        _svgContainer.append("g")
                     .attr("class", "xAxis")
                     .call(xAxis)
                     .selectAll("line")
                     .attr("transform", "translate(0, -4)"); //lift up the ticks

        _svgContainer.append("g")
                     .attr("class", "home-actions");

        _svgContainer.append("g")
                     .attr("class", "away-actions");
    }

    var _areOverlapping = function(source, target) {
      var sourceRectangle = source.getBoundingClientRect();
      var targetRectangle = target.getBoundingClientRect();
      return !(sourceRectangle.right <= targetRectangle.left || sourceRectangle.left >= targetRectangle.right);
    }

    var init = function(lengthOfPeriodInSeconds) {
        _timelineLengthInSeconds = lengthOfPeriodInSeconds * 10;
        _buildTimeline();
    };

    var _handleActionAddition = function(timeInSeconds, config) {
      config.teamActionData.push({
        timeInSeconds: timeInSeconds,
        overlapsEntries: 1,
        isOverlapped: false
      });

      //setting up of
      var actionGroups = _svgContainer.select(config.teamActionGroupSelector)
        .selectAll("g")
        .data(config.teamActionData)
        .enter()
        .append("g")
          .attr("class", config.teamActionItemClassName);

        actionGroups.append("circle")
          .attr("cx", function(data) {return _xAxisScale(data.timeInSeconds)})
          .attr("cy", config.yPositionOnTimeline)
          .attr("r", 10)
          .attr("fill", config.itemColor);

        actionGroups.append("text")
          .attr("font-family", "sans-serif")
          .attr("font-size", "10px")
          .attr("fill", "white");

      var _actionNodes = _svgContainer.selectAll("g." + config.teamActionItemClassName)
                                          .nodes();

      //check if there are any colliding items and update their statuses accordingly
      var nodeCount = _actionNodes.length;
      if (nodeCount > 1) {
        for (var i = 0; i < nodeCount - 1; i++) {
          for (var j = i + 1; j < nodeCount; j++) {

            //get DOM elements of action items
            var sourceNode = d3.select(_actionNodes[i]).select("circle").node();
            var targetNode = d3.select(_actionNodes[j]).select("circle").node();

            //get data bound to DOM elements
            var sourceNodeData = d3.select(_actionNodes[i]).datum();
            var targetNodeData = d3.select(_actionNodes[j]).datum();

            //skip collision checking if an overlap was previously logged
            if (targetNodeData.isOverlapped) {
              continue;
            }

            //performs collision check between DOM elements
            var overlaps = _areOverlapping(sourceNode, targetNode);

            //if the action items overlap,
            //overlapping entries counter is increased and the overlapped item is hid
            if (overlaps) {
              sourceNodeData.overlapsEntries++;
              targetNodeData.isOverlapped = true;

              //add text to the action item representing a number of items it overlaps
              d3.select(_actionNodes[i])
                .select("text")
                  .attr("x", _xAxisScale(sourceNodeData.timeInSeconds) - 3)
                  .attr("y", config.yPositionOnTimeline + 3)
                  .text( function (d) {
                     return d3.select(this).datum().overlapsEntries;
                   });

              d3.select(_actionNodes[j])
                .attr("visibility", "hidden");
            }
          }
        }
      }
    }

    var addAction = function(timeInSeconds, team){
        switch (team) {
            case "HOME":
                _handleActionAddition(timeInSeconds, _homeTeamConfig);
                break;
            case "AWAY":
              _handleActionAddition(timeInSeconds, _awayTeamConfig);
                break;
            default:
                break;
        }
    };

    return {
        init: init,
        addAction: addAction
    }
})();


var init = function(lengthOfPeriodInSeconds) {
    TimelineBuilder.init(lengthOfPeriodInSeconds);
}

var addAction = function(timeInSeconds, team){
    TimelineBuilder.addAction(timeInSeconds, team);
};

//usage sample
init(5);
addAction(5, "HOME");
addAction(12, "AWAY");
addAction(15, "AWAY");
