<%@ include file="./inc/_taglibs.jsp"%>

<struct:htmlWrapper navi="backlog">
<jsp:body>

<div class="structure-main-block" id="backlogInfo">
<ul class="backlogTabs">
  <li class=""><a href="#backlogDetails"><span><img
    alt="Edit" src="static/img/info.png" /> Info</span></a></li>
  <li class=""><a href="#backlogAssignees"><span><img
    alt="Edit" src="static/img/team.png" /> Assignees</span></a></li>
  <c:if test="${settings.hourReportingEnabled}">
  <li class=""><a href="#backlogSpentEffort"><span><img
    alt="Edit" src="static/img/timesheets.png" /> Spent effort</span></a></li>
  </c:if>
  <li class=""><a href="#backlogHistory"><span><img
    alt="Edit" src="static/img/timesheets.png" /> History</span></a></li>
</ul>

<div class="details" id="backlogDetails" style="overflow: auto;"></div>
<div class="details" id="backlogAssignees"></div>
<div class="details" id="backlogSpentEffort"></div>

</div>


<script type="text/javascript">
var agilefantTimesheetsEnabled = ${settings.hourReportingEnabled};

$(document).ready(function() {
  $("#backlogInfo").tabs();
  $("#releaseContents").tabs();
  var controller = new ProjectController({
    id: ${project.id},
    projectDetailsElement: $("#backlogDetails"),
    assigmentListElement: $("#backlogAssignees"),
    iterationListElement: $("#iterations"),
    storyListElement: $('#stories'),
    hourEntryListElement: $("#backlogSpentEffort"),
    storyTreeElement: $('#storyTree')
  });
  if(Configuration.isTimesheetsEnabled()) {
  	$("#backlogInfo").bind('tabsselect', function(event, ui) {
	    if (ui.index == 2) {
      	controller.selectSpentEffortTab();
    	}
  	});
  }
  
  $("#treeHideDone").change(function() {
    var opt = $(this);
    if(opt.is(":checked")) {
      $("#storyTree [storystate=DONE]").hide();
    } else {
      $("#storyTree li").show();
    }
  });
});
</script>

<div style="margin-top: 3em;" class="structure-main-block" id="releaseContents">
<ul class="backlogTabs">
  <li class=""><a href="#stories"><span><img
				alt="Edit" src="static/img/info.png" /> Stories</span></a></li>
  <li class=""><a href="#storyTreeContainer"><span><img
				alt="Edit" src="static/img/info.png" /> Story tree</span></a></li>
  <li class=""><a href="#iterations"><span><img
				alt="Edit" src="static/img/backlog.png" /> Iterations</span></a></li>
</ul>

<form onsubmit="return false;">
  <div class="details" id="stories"></div>
  <div class="details" id="storyTreeContainer">
    <input id="treeHideDone" type="checkbox"/>Hide done stories
    <div id="storyTree">&nbsp;</div>
  </div>
  <div class="details" id="iterations">
  		<div id="iterations">&nbsp;</div>
  </div>
</form>

</div>



<p><img src="drawProjectBurnup.action?backlogId=${project.id}"
						id="bigChart" width="780" height="600" /></p>

</jsp:body>
</struct:htmlWrapper>
