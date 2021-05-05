function doGet() {
  const template = HtmlService.createTemplateFromFile("page");
  // const styles = HtmlService.createTemplateFromFile("styles").getRawContent();
  template.styles = "";
  template.enabledDays = getEnabledDays();
  return template
    .evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function getEnabledDays() {
  const ss = SpreadsheetApp.getActive();
  const calendar_config_sheet = ss.getSheetByName(SHEET_NAMES.CALENDAR_CONFIG);
  const calData = calendar_config_sheet
    .getRange(
      1,
      1,
      calendar_config_sheet.getLastRow(),
      calendar_config_sheet.getLastColumn()
    )
    .getValues();
  const calendarId = calData[1][0];
  const enabledDays = [];

  let dayNumber = -1;
  for (let i = 0; i < 14; i += 2) {
    const result = calData[4][i];
    dayNumber++;
    if (result != "on") continue;
    enabledDays.push(dayNumber);
  }
  return enabledDays;
}
