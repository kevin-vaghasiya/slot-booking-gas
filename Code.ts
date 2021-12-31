function doGet() {
  const template = HtmlService.createTemplateFromFile("page");
  const ss = SpreadsheetApp.getActive();
  const calendar_config_sheet = ss.getSheetByName(SHEET_NAMES.CALENDAR_CONFIG);
  template.enabledDays = getEnabledDays(calendar_config_sheet);
  return template
    .evaluate()
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function bookSlot({ date, startTime, endTime, title }) {
  if (!date) return JSON.stringify({ error: true, message: "missing date." });
  if (!startTime)
    return JSON.stringify({ error: true, message: "missing slot." });
  if (!endTime)
    return JSON.stringify({ error: true, message: "missing slot." });
  if (!title) return JSON.stringify({ error: true, message: "missing title." });

  const selectedDate = new Date(date);
  const st = new Date(date);
  const et = new Date(date);
  const tempStart = new Date(startTime);
  const tempEnd = new Date(endTime);
  st.setHours(tempStart.getHours());
  st.setMinutes(tempStart.getMinutes());
  st.setSeconds(tempStart.getSeconds());
  et.setHours(tempEnd.getHours());
  et.setMinutes(tempEnd.getMinutes());
  et.setSeconds(tempEnd.getSeconds());

  const ss = SpreadsheetApp.getActive();
  const calendar_config_sheet = ss.getSheetByName(SHEET_NAMES.CALENDAR_CONFIG);
  const enabledDays = getEnabledDays(calendar_config_sheet);
  const day = selectedDate.getDay();
  if (enabledDays.indexOf(day) == -1)
    return JSON.stringify({
      error: true,
      message: "time slot not available, please try again.",
      retry: true,
    });

  const calendarId = calendar_config_sheet.getRange("A2").getValue();
  const calendar = CalendarApp.getCalendarById(calendarId);
  const events = calendar.getEvents(st, et);
  if (events.length)
    return JSON.stringify({
      error: true,
      message: "time slot not available, please try again.",
      retry: true,
    });

  calendar.createEvent(title, st, et);
  return JSON.stringify({
    success: true,
    message: "slot booked successfully.",
  });
}

function getEnabledDays(
  calendar_config_sheet: GoogleAppsScript.Spreadsheet.Sheet
) {
  const calData = calendar_config_sheet
    .getRange(
      1,
      1,
      calendar_config_sheet.getLastRow(),
      calendar_config_sheet.getLastColumn()
    )
    .getValues();
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

function getAvailableTimeslots({ date }) {
  const selectedDate = new Date(date);
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
  let slots = [];
  const possibleSlots = getPossibleTimeslots(selectedDate.getDay(), calData);
  if (!possibleSlots.length) return JSON.stringify({ slots });
  const calendar = CalendarApp.getCalendarById(calendarId);
  slots = getAvailableSlots(possibleSlots, calendar, date);
  return JSON.stringify({ slots });
}

function getAvailableSlots(
  possibleSlots: Array<object>,
  calendar: GoogleAppsScript.Calendar.Calendar,
  date
) {
  const slots = [];
  for (let i = 0; i < possibleSlots.length; i++) {
    const { startTime, endTime } = possibleSlots[i];

    const st = new Date(date);
    const et = new Date(date);
    const tempStart = new Date(startTime);
    const tempEnd = new Date(endTime);
    st.setHours(tempStart.getHours());
    st.setMinutes(tempStart.getMinutes());
    st.setSeconds(tempStart.getSeconds());
    et.setHours(tempEnd.getHours());
    et.setMinutes(tempEnd.getMinutes());
    et.setSeconds(tempEnd.getSeconds());

    const events = calendar.getEvents(st, et);
    if (events.length) continue;
    slots.push(possibleSlots[i]);
  }
  return slots;
}

function getPossibleTimeslots(day: number, calData) {
  const indx = day == 0 ? 0 : day * 2;
  const slots = [];
  if (calData[4][indx] != "on") return slots;
  for (let i = 6; i < calData.length; i++) {
    const startTime = calData[i][indx];
    const endTime = calData[i][indx + 1];
    if (!startTime || !endTime) continue;
    const st = new Date(startTime);
    const et = new Date(endTime);
    if (et <= st) continue;
    slots.push({ startTime: st, endTime: et });
  }
  return slots;
}
