$(document).ready(function () {
  tableau.extensions.initializeDialogAsync().then(function (openPayload) {
    let dashboard = tableau.extensions.dashboardContent.dashboard;
    dashboard.worksheets.forEach(function (worksheet) {
      $("#selectSourceWorksheet").append(
        "<option value='" + worksheet.name + "'>" + worksheet.name + "</option>"
      );
      $("#selectTargetWorksheet").append(
        "<option value='" + worksheet.name + "'>" + worksheet.name + "</option>"
      );
    });
    var savedSourceSheet = tableau.extensions.settings.get("source_sheet");
    var savedTargetSheet = tableau.extensions.settings.get("target_sheet");
    if (savedSourceSheet != undefined) {
      $("#selectSourceWorksheet").val(savedSourceSheet);
      updateSourceSheetSelection();
    }
    $("#selectSourceWorksheet").on("change", "", function () {
      updateSourceSheetSelection();
    });
    if (savedTargetSheet != undefined) {
      $("#selectTargetWorksheet").val(savedTargetSheet);
      updateTargetSheetSelection();
    }
    $("#selectTargetWorksheet").on("change", "", function () {
      updateTargetSheetSelection();
    });
    $("#cancel").click(closeDialog);
    $("#save").click(saveButton);
    console.log("configure ready");
  });
});

function updateSourceSheetSelection() {
  var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  var savedSourceSheet = $("#selectSourceWorksheet").val();

  var worksheet = worksheets.find(function (sheet) {
    return sheet.name === savedSourceSheet;
  });

  worksheet.getSummaryDataAsync({ maxRows: 1 }).then(function (sumdata) {
    var worksheetColumns = sumdata.columns;
    $("#selectFieldNodeId").html('<option selected="selected"></option>');
    $("#selectFieldParentId").html('<option selected="selected"></option>');
    $("#selectFieldFullName").html('<option selected="selected"></option>');
    $("#selectFieldOrgUnit").html('<option selected="selected"></option>');
    $("#selectFieldPosition").html('<option selected="selected"></option>');
    $("#selectFieldPicture").html('<option selected="selected"></option>');
    $("#selectFieldLocation1").html('<option selected="selected"></option>');
    $("#selectFieldLocation2").html('<option selected="selected"></option>');
    worksheetColumns.forEach(function (current_value) {
      $("#selectFieldNodeId").append(
        "<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>"
      );
      $("#selectFieldParentId").append(
        "<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>"
      );
      $("#selectFieldFullName").append(
        "<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>"
      );
      $("#selectFieldOrgUnit").append(
        "<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>"
      );
      $("#selectFieldPosition").append(
        "<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>"
      );
      $("#selectFieldPicture").append(
        "<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>"
      );
      $("#selectFieldLocation1").append(
        "<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>"
      );
      $("#selectFieldLocation2").append(
        "<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>"
      );
    });
    var sel_value = tableau.extensions.settings.get("field_node_id");
    if (sel_value != undefined) {
      $("#selectFieldNodeId").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("field_parent_id");
    if (sel_value != undefined) {
      $("#selectFieldParentId").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("field_full_name");
    if (sel_value != undefined) {
      $("#selectFieldFullName").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("field_org_unit");
    if (sel_value != undefined) {
      $("#selectFieldOrgUnit").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("field_position");
    if (sel_value != undefined) {
      $("#selectFieldPosition").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("field_picture");
    if (sel_value != undefined) {
      $("#selectFieldPicture").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("field_location1");
    if (sel_value != undefined) {
      $("#selectFieldLocation1").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("field_location2");
    if (sel_value != undefined) {
      $("#selectFieldLocation2").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("default_picture");
    if (sel_value != undefined) {
      $("#inputDefaultPicture").val(sel_value);
    }
    sel_value = tableau.extensions.settings.get("picture_url_template");
    if (sel_value != undefined) {
      $("#inputPictureUrlTemplate").val(sel_value);
    }
  });
}

function updateTargetSheetSelection() {
  var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  var savedTargetSheet = $("#selectTargetWorksheet").val();

  var worksheet = worksheets.find(function (sheet) {
    return sheet.name === savedTargetSheet;
  });

  if (worksheet) {
    worksheet.getFiltersAsync().then(function (filters) {
      // console.log(filters);
      $("#selectTargetFilter").html('<option selected="selected"></option>');
      filters.forEach(function (f) {
        if (f.filterType == "categorical") {
          $("#selectTargetFilter").append(
            "<option value='" + f.fieldName + "'>" + f.fieldName + "</option>"
          );
        }
      });
      var sel_value = tableau.extensions.settings.get("target_filter");
      if (sel_value != undefined) {
        $("#selectTargetFilter").val(sel_value);
      }
    });
  }
}

function reloadSettings() {}

function closeDialog() {
  console.log("cancel dialog");
  tableau.extensions.ui.closeDialog("10");
}

function saveButton() {
  console.log("save button");
  tableau.extensions.settings.set("source_sheet", $("#selectSourceWorksheet").val());
  tableau.extensions.settings.set("field_node_id", $("#selectFieldNodeId").val());
  tableau.extensions.settings.set("field_parent_id", $("#selectFieldParentId").val());
  tableau.extensions.settings.set("field_full_name", $("#selectFieldFullName").val());
  tableau.extensions.settings.set("field_org_unit", $("#selectFieldOrgUnit").val());
  tableau.extensions.settings.set("field_position", $("#selectFieldPosition").val());
  tableau.extensions.settings.set("field_picture", $("#selectFieldPicture").val());
  tableau.extensions.settings.set("field_location1", $("#selectFieldLocation1").val());
  tableau.extensions.settings.set("field_location2", $("#selectFieldLocation2").val());
  tableau.extensions.settings.set("default_picture", $("#inputDefaultPicture").val());
  tableau.extensions.settings.set("picture_url_template", $("#inputPictureUrlTemplate").val());
  tableau.extensions.settings.set("target_sheet", $("#selectTargetWorksheet").val());
  tableau.extensions.settings.set("target_filter", $("#selectTargetFilter").val());
  tableau.extensions.settings.saveAsync().then((currentSettings) => {
    tableau.extensions.ui.closeDialog("10");
  });
}
