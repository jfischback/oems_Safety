// Regulatory rules and reference lists for the Recordability Determination Tool.
// Every rule has an ID, its citation, and where it comes from:
//   "Regulation"     = the text of 29 CFR Part 1904 (or 1910.95 for the age-correction tables)
//   "Interpretation" = an OSHA interpretation letter or recordkeeping FAQ
// The screens (tool.js) and the logic (engine.js) use these IDs; nothing in this file collects data.

export const RULES_REVIEWED = "2026-11-05";

const R = (cite, source, text) => ({ cite, source, text });
const REG = "Regulation", INT = "Interpretation";

export const RULES = {
  // Employer applicability
  "EMP-SIZE": R("1904.1", REG, "A company with 10 or fewer employees at all times during the last calendar year (all locations combined) does not have to keep routine OSHA 300 and 301 records."),
  "EMP-NAICS": R("1904.2 and Appendix A to Subpart B", REG, "An establishment in an industry listed in Appendix A to Subpart B does not have to keep routine OSHA 300 and 301 records. The test is per establishment."),
  "EMP-ASKED": R("1904.41 and 1904.42", REG, "If OSHA or the Bureau of Labor Statistics tells the company in writing to keep records, the size and industry exemptions do not apply."),
  "EMP-REPORT-ALL": R("1904.39", REG, "Every employer, including one exempt from keeping logs, must report a work-related fatality, in-patient hospitalization, amputation or loss of an eye."),
  "EMP-STATE": R("Federal OSHA baseline", REG, "This tool applies federal OSHA rules only. A state plan may have recordkeeping and reporting rules that differ from or add to federal rules."),

  // Covered employee and establishment
  "COV-SUPERVISE": R("1904.31", REG, "The employer that supervises the worker day to day records the case, whether the worker is on that employer's payroll or is a temporary, leased or contract worker. Coordinate so the case is recorded only once."),
  "COV-ESTAB": R("1904.30", REG, "Record the case on the log of the establishment where it happened. If it happened away from all of your establishments, record it on the log of the establishment where the employee normally works."),

  // Injury or illness
  "INJ-DEF": R("1904.4 and 1904.46", REG, "A case is recorded only if the employee had an injury or illness: an abnormal condition or disorder."),

  // Work-relatedness
  "WR-ENV": R("1904.5(a) and (b)(1)", REG, "A case is work-related if an event or exposure in the work environment caused or contributed to it, or significantly aggravated a pre-existing condition."),
  "WR-EXC-PUBLIC": R("1904.5(b)(2)(i)", REG, "Not work-related: the employee was present as a member of the general public, not as an employee."),
  "WR-EXC-SYMPTOMS": R("1904.5(b)(2)(ii)", REG, "Not work-related: symptoms appeared at work but came solely from a non-work event or exposure."),
  "WR-EXC-WELLNESS": R("1904.5(b)(2)(iii)", REG, "Not work-related: it came solely from voluntary participation in a wellness, medical, fitness or recreational activity."),
  "WR-EXC-FOOD": R("1904.5(b)(2)(iv)", REG, "Not work-related: it came solely from eating, drinking or preparing food for personal consumption. This exception does not apply to food contaminated by workplace contaminants or food poisoning from food the employer supplied."),
  "WR-EXC-PERSONAL": R("1904.5(b)(2)(v)", REG, "Not work-related: it came solely from personal tasks outside assigned working hours."),
  "WR-EXC-GROOMING": R("1904.5(b)(2)(vi)", REG, "Not work-related: it came solely from personal grooming, self-medication for a non-work condition, or was intentionally self-inflicted."),
  "WR-EXC-COMMUTE": R("1904.5(b)(2)(vii)", REG, "Not work-related: a motor vehicle accident in a company parking lot or on a company access road while commuting."),
  "WR-EXC-COLD": R("1904.5(b)(2)(viii)", REG, "Not work-related: the common cold or flu."),
  "WR-EXC-MENTAL": R("1904.5(b)(2)(ix)", REG, "Not work-related: mental illness, unless the employee voluntarily gives a physician's or licensed health care professional's opinion that it is work-related."),
  "WR-TRAVEL": R("1904.5(b)(6)", REG, "During travel, a case is work-related only if the employee was doing work in the interest of the employer. Time in a hotel or other temporary residence, commuting between it and a fixed job location, and personal side trips off a reasonably direct route are judged as they would be for an employee who is not traveling."),
  "WR-HOME": R("1904.5(b)(7)", REG, "When working at home, a case is work-related only if it came directly from the work, not from the general home environment."),
  "WR-PREEXIST": R("1904.5(b)(4) and (b)(5)", REG, "A pre-existing condition (one that came solely from a non-work event or exposure) is significantly aggravated, and so work-related, only if the work event caused death, loss of consciousness, days away, restricted work or job transfer, or new or changed medical treatment that would not otherwise have happened."),

  // New case
  "NC-NEW": R("1904.6(a)", REG, "It is a new case if the employee has not had a recorded case of the same type to the same body part, or had fully recovered (all signs and symptoms gone) before a new workplace event or exposure brought it back."),
  "NC-CHRONIC": R("1904.6(b)(1)", REG, "A chronic illness that can recur without new exposure (for example silicosis or occupational cancer) is recorded only once."),
  "NC-HCP": R("1904.6(b)(3)", REG, "If a physician or other licensed health care professional gives an opinion on whether it is a new case or a recurrence, follow it."),

  // Special cases
  "SP-NEEDLE": R("1904.8", REG, "A needlestick or cut from a sharp contaminated with another person's blood or other potentially infectious material is recorded as an injury and is a privacy case. A splash with no cut is recorded only if it leads to a bloodborne illness diagnosis or meets the general criteria."),
  "SP-HEARING": R("1904.10", REG, "Hearing loss is recorded if there is a standard threshold shift (an average change of 10 dB or more from baseline at 2000, 3000 and 4000 Hz in either ear) and the total hearing level in that ear averages 25 dB or more above audiometric zero at the same frequencies. Age correction may be used for the shift, not the 25 dB test."),
  "SP-HEARING-RETEST": R("1904.10(b)(4)", REG, "A retest within 30 days of the first audiogram that does not confirm the shift means it need not be recorded."),
  "SP-HEARING-WR": R("1904.10(b)(6)", REG, "If a physician or licensed health care professional determines the hearing loss is not work-related, or that occupational noise did not significantly aggravate it, it is not recorded."),
  "SP-HEARING-AGE": R("1910.95 Appendix F", REG, "Age-correction values come from Tables F-1 (males) and F-2 (females) of Appendix F to 1910.95."),
  "SP-TB": R("1904.11", REG, "Tuberculosis is recorded if the employee was exposed at work to a known case of active TB and then has a positive skin test or a diagnosis. It is not recorded if the employee lives with someone with active TB, public health identified them as a contact of an unrelated case, a medical investigation shows the infection came from outside work, or it was a positive pre-employment test."),
  "SP-REMOVAL": R("1904.9", REG, "A medical removal under an OSHA standard is recorded as a days-away case or a restricted case depending on how the removal is done. A voluntary removal before the standard's removal levels are reached is not recorded under this rule, but still goes through the general criteria."),
  "SP-REMOVAL-COL": R("1904.9", REG, "A medical removal that came from a chemical exposure is entered in the poisoning column."),

  // General recording criteria
  "GC-DEATH": R("1904.7(b)(2)", REG, "A work-related death is recordable."),
  "GC-AWAY": R("1904.7(b)(3)", REG, "Days away from work are recordable. Do not count the day of the injury. A physician's or licensed health care professional's recommendation of days away counts even if the employee came to work anyway."),
  "GC-RESTRICT": R("1904.7(b)(4)", REG, "Restricted work or job transfer is recordable: the employee was kept from one or more routine job functions (anything done at least once a week) or from a full workday, or a provider recommended that. A restriction only on the day of injury does not count. Producing less while doing all routine functions for a full shift does not count."),
  "GC-RESTRICT-VAGUE": R("1904.7(b)(4)(vii)", REG, "If a restriction is vague and the provider cannot clarify it, record it as restricted. Document the attempt to get clarification."),
  "GC-MT": R("1904.7(b)(5)", REG, "Medical treatment beyond first aid is recordable, no matter who gives it. Visits only for observation or counseling, and diagnostic tests such as X-rays and blood tests, are not treatment. A medical visit by itself is not recordable."),
  "GC-MT-RECOMMENDED": R("1904.7(b)(5)(v)", REG, "Treatment that a physician or licensed health care professional recommended counts even if the employee refused it or did not follow it."),
  "GC-FIRSTAID": R("1904.7(b)(5)(ii)", REG, "Anything on OSHA's first aid list is first aid, not medical treatment. Anything not on the list is medical treatment."),
  "GC-RX": R("OSHA Recordkeeping FAQ 7-8", INT, "Prescription strength means more than the single dose on the over-the-counter label."),
  "GC-GLUE": R("OSHA interpretation letter, August 26, 2004", INT, "Medical glue (skin adhesive) used to close a wound is medical treatment, like sutures and staples."),
  "GC-LOC": R("1904.7(b)(6)", REG, "Loss of consciousness, for any length of time, is recordable."),
  "GC-DIAG": R("1904.7(b)(7)", REG, "A significant diagnosis by a physician or licensed health care professional is recordable at diagnosis, even with no treatment or work restriction: cancer, chronic irreversible disease, a fractured or cracked bone, or a punctured eardrum."),
  "GC-TOOTH": R("OSHA interpretation letter, November 12, 2015", INT, "A diagnosed chipped, broken or fractured tooth is treated like a fracture."),
  "GC-CONFLICT": R("1904.6(b)(3) and 1904.7(b)(3)", REG, "When two or more providers give conflicting opinions, the employer chooses the most authoritative one and can document why."),

  // OSHA 300 log
  "LOG-OUTCOME": R("1904.29 and Form 300 instructions", REG, "Check exactly one outcome box, the most serious: Death, then Days away, then Job transfer or restriction, then Other recordable case. If the case later becomes more serious, change the box."),
  "LOG-DAYS": R("1904.7(b)(3) and (b)(4)", REG, "Count calendar days starting the day after the injury, including weekends and holidays. A provider's recommendation counts even if not followed, and a provider's return-to-work date ends the count even if the employee stays out. Counting may stop if the employee leaves for a reason unrelated to the case, or when a job is permanently modified (at least one restricted day still counts). Days away and restricted days together may be capped at 180."),
  "LOG-180": R("OSHA Recordkeeping FAQ 7-18", INT, "If a case reaches 180 restricted days and then becomes days away, enter 180 restricted, optionally 1 day away, and check the days-away box."),
  "LOG-TYPE": R("Form 300 instructions; OSHA Recordkeeping FAQ (osha.gov/faq/389)", INT, "A case from an instantaneous event or exposure is an injury; anything else is an illness."),
  "LOG-PRIVACY": R("1904.29(b)(7)", REG, "Privacy cases: an intimate body part or the reproductive system; sexual assault; mental illness; HIV infection, hepatitis or tuberculosis; contaminated needlesticks and sharps cuts; other illnesses if the employee voluntarily asks that their name not be entered. Enter \"Privacy case\" instead of the name."),
  "LOG-PRIVACY-LIST": R("1904.29(b)(6)", REG, "For a privacy case, keep a separate, confidential list of case numbers and names. Give it to the government if it asks."),
  "LOG-PRIVACY-DESC": R("1904.29(b)(9)", REG, "For a privacy case, the description can leave out private details but must still state the cause and general severity."),
  "LOG-7DAY": R("1904.29(b)(3)", REG, "Enter the case on the 300 log and complete the 301 within 7 calendar days of learning about it."),
  "LOG-300A": R("1904.32", REG, "After year end, a company executive certifies the 300A summary, which is posted from February 1 to April 30."),
  "LOG-EFILE": R("1904.41", REG, "By March 2: an establishment with 20 to 249 employees in an industry listed in Appendix A to Subpart E submits the 300A; an establishment with 250 or more employees that must keep records submits the 300A; an establishment with 100 or more employees in an industry listed in Appendix B to Subpart E also submits its 300 and 301 data. Size is based on the previous calendar year. The submission needs the EIN. OSHA does not collect employee names and addresses, health care professionals' names, or treatment facility names and addresses."),
  "LOG-RETAIN": R("1904.33", REG, "Keep the 300, 300A, 301 and privacy list for 5 years after the end of the year. Keep the 300 log updated with newly discovered cases and changes in classification; the 300A and 301 do not have to be updated."),
  "LOG-ACCESS": R("1904.35", REG, "Give the 300 log to an employee, former employee, personal representative or authorized employee representative by the end of the next business day; an employee's own 301 to that employee or their personal representative by the end of the next business day; and the case description section of the 301s to an authorized employee representative within 7 calendar days."),
  "LOG-GOV": R("1904.40", REG, "Give copies of the records within 4 business hours when an authorized government representative asks, including OSHA, NIOSH or a state-plan agency."),

  // Reporting
  "RPT-DEATH": R("1904.39(a)(1)", REG, "Report a work-related death within 8 hours of the death, if it happened within 30 days of the incident."),
  "RPT-SEVERE": R("1904.39(a)(2)", REG, "Report a work-related in-patient hospitalization, amputation or loss of an eye within 24 hours of the event, if it happened within 24 hours of the incident."),
  "RPT-LATE": R("1904.39(b)(7) and (b)(8)", REG, "If you or your agent learn of the event later, or learn later that it was work-related, the clock starts when you learn it."),
  "RPT-DEF": R("1904.39(b)", REG, "In-patient hospitalization is formal admission for care or treatment, not only observation or diagnostic testing. An amputation includes a fingertip; it does not include an avulsion, degloving, scalping, severed ear or broken tooth."),
  "RPT-EXC": R("1904.39(b)", REG, "Not reportable if it happened in a motor vehicle accident on a public street or highway outside a construction work zone, or on a commercial or public transportation system such as a plane, train or bus. A reporting exception does not decide whether the case is recordable."),
  "RPT-HOW": R("1904.39(a)(3)", REG, "Report by calling or visiting the nearest OSHA Area Office, calling 1-800-321-OSHA (6742), or using the online report form on osha.gov. Voicemail, fax and email do not count."),

  // Tool rule
  "TOOL-UNSURE": R("Tool rule", REG, "A Not sure answer never counts as No. The case is marked Needs review until the fact is known."),
};

// Appendix A to Subpart B of Part 1904: partially exempt industries (NAICS industry groups).
// Copied from osha.gov/laws-regs/regulations/standardnumber/1904/1904SubpartBAppA and cross-checked
// against osha.gov/recordkeeping/ppt1/RK1exempttable.html (82 codes).
export const NAICS_CHECKED = "2026-11-05";
export const NAICS_EXEMPT = {
  "4412": "Other Motor Vehicle Dealers", "4431": "Electronics and Appliance Stores", "4461": "Health and Personal Care Stores",
  "4471": "Gasoline Stations", "4481": "Clothing Stores", "4482": "Shoe Stores", "4483": "Jewelry, Luggage, and Leather Goods Stores",
  "4511": "Sporting Goods, Hobby, and Musical Instrument Stores", "4512": "Book, Periodical, and Music Stores", "4531": "Florists",
  "4532": "Office Supplies, Stationery, and Gift Stores", "4812": "Nonscheduled Air Transportation", "4861": "Pipeline Transportation of Crude Oil",
  "4862": "Pipeline Transportation of Natural Gas", "4869": "Other Pipeline Transportation", "4879": "Scenic and Sightseeing Transportation, Other",
  "4885": "Freight Transportation Arrangement", "5111": "Newspaper, Periodical, Book, and Directory Publishers", "5112": "Software Publishers",
  "5121": "Motion Picture and Video Industries", "5122": "Sound Recording Industries", "5151": "Radio and Television Broadcasting",
  "5172": "Wireless Telecommunications Carriers (except Satellite)", "5173": "Telecommunications Resellers", "5179": "Other Telecommunications",
  "5181": "Internet Service Providers and Web Search Portals", "5182": "Data Processing, Hosting, and Related Services", "5191": "Other Information Services",
  "5211": "Monetary Authorities—Central Bank", "5221": "Depository Credit Intermediation", "5222": "Nondepository Credit Intermediation",
  "5223": "Activities Related to Credit Intermediation", "5231": "Securities and Commodity Contracts Intermediation and Brokerage",
  "5232": "Securities and Commodity Exchanges", "5239": "Other Financial Investment Activities", "5241": "Insurance Carriers",
  "5242": "Agencies, Brokerages, and Other Insurance Related Activities", "5251": "Insurance and Employee Benefit Funds", "5259": "Other Investment Pools and Funds",
  "5312": "Offices of Real Estate Agents and Brokers", "5331": "Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)", "5411": "Legal Services",
  "5412": "Accounting, Tax Preparation, Bookkeeping, and Payroll Services", "5413": "Architectural, Engineering, and Related Services",
  "5414": "Specialized Design Services", "5415": "Computer Systems Design and Related Services", "5416": "Management, Scientific, and Technical Consulting Services",
  "5417": "Scientific Research and Development Services", "5418": "Advertising and Related Services", "5511": "Management of Companies and Enterprises",
  "5611": "Office Administrative Services", "5614": "Business Support Services", "5615": "Travel Arrangement and Reservation Services",
  "5616": "Investigation and Security Services", "6111": "Elementary and Secondary Schools", "6112": "Junior Colleges",
  "6113": "Colleges, Universities, and Professional Schools", "6114": "Business Schools and Computer and Management Training", "6115": "Technical and Trade Schools",
  "6116": "Other Schools and Instruction", "6117": "Educational Support Services", "6211": "Offices of Physicians", "6212": "Offices of Dentists",
  "6213": "Offices of Other Health Practitioners", "6214": "Outpatient Care Centers", "6215": "Medical and Diagnostic Laboratories", "6244": "Child Day Care Services",
  "7114": "Agents and Managers for Artists, Athletes, Entertainers, and Other Public Figures", "7115": "Independent Artists, Writers, and Performers",
  "7213": "Rooming and Boarding Houses", "7221": "Full-Service Restaurants", "7222": "Limited-Service Eating Places", "7224": "Drinking Places (Alcoholic Beverages)",
  "8112": "Electronic and Precision Equipment Repair and Maintenance", "8114": "Personal and Household Goods Repair and Maintenance", "8121": "Personal Care Services",
  "8122": "Death Care Services", "8131": "Religious Organizations", "8132": "Grantmaking and Giving Services", "8133": "Social Advocacy Organizations",
  "8134": "Civic and Social Organizations", "8139": "Business, Professional, Labor, Political, and Similar Organizations",
};

// OSHA-approved State Plans, from osha.gov/stateplans (checked 2026-11-05).
export const STATE_PLANS_ALL = ["Alaska", "Arizona", "California", "Hawaii", "Indiana", "Iowa", "Kentucky", "Maryland", "Michigan", "Minnesota", "Nevada", "New Mexico", "North Carolina", "Oregon", "Puerto Rico", "South Carolina", "Tennessee", "Utah", "Vermont", "Virginia", "Washington", "Wyoming"];
export const STATE_PLANS_PUBLIC = ["Connecticut", "Illinois", "Maine", "Massachusetts", "New Jersey", "New York", "U.S. Virgin Islands"];
export const PLACES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "American Samoa", "Guam", "Northern Mariana Islands", "Puerto Rico", "U.S. Virgin Islands"];

// 1910.95 Appendix F, Tables F-1 (males) and F-2 (females): age-correction values in dB at 2000, 3000 and 4000 Hz,
// for ages 20 (or younger) through 60 (or older). Copied from 29 CFR 1910.95 Appendix F and cross-checked against a second copy.
const ROWS_M = "3,4,5 3,4,5 3,4,5 3,4,6 3,5,6 3,5,7 4,5,7 4,6,7 4,6,8 4,6,8 4,6,9 4,7,9 5,7,10 5,7,10 5,8,11 5,8,11 5,9,12 6,9,12 6,9,13 6,10,14 6,10,14 6,10,14 7,11,16 7,12,16 7,12,17 7,13,18 8,13,19 8,14,19 8,14,20 9,15,21 9,16,22 9,16,23 10,17,24 10,18,25 10,18,26 11,19,27 11,20,28 11,21,29 12,22,31 12,22,32 13,23,33";
const ROWS_F = "4,3,3 4,4,3 4,4,4 5,4,4 5,4,4 5,4,4 5,5,4 5,5,5 5,5,5 5,5,5 6,5,5 6,6,5 6,6,6 6,6,6 6,6,6 6,7,7 7,7,7 7,7,7 7,7,7 7,8,8 7,8,8 8,8,8 8,9,9 8,9,9 8,9,9 8,10,10 9,10,10 9,10,11 9,11,11 9,11,11 10,11,12 10,12,12 10,12,13 10,13,13 11,13,14 11,14,14 11,14,15 11,15,15 12,15,16 12,16,16 12,16,17";
const table = s => s.split(" ").map(r => r.split(",").map(Number));
export const AGE_CORRECTION = { male: table(ROWS_M), female: table(ROWS_F) };
export const ageCorrection = (sex, age) => AGE_CORRECTION[sex][Math.min(60, Math.max(20, Math.round(age))) - 20];

// 1904.7(b)(5)(ii): the complete first aid list.
export const FIRST_AID = [
  "Non-prescription medication at non-prescription strength (prescription strength means more than the single dose on the over-the-counter label; OSHA FAQ 7-8)",
  "Tetanus immunizations (other immunizations are medical treatment)",
  "Cleaning, flushing or soaking surface wounds",
  "Wound coverings such as bandages, gauze pads, butterfly bandages or Steri-Strips (sutures, staples and medical glue are medical treatment)",
  "Hot or cold therapy",
  "Non-rigid support such as elastic bandages, wraps, or non-rigid back belts (devices with rigid stays or that immobilize a body part are medical treatment)",
  "Temporary immobilization while transporting a victim (splints, slings, neck collars, back boards)",
  "Drilling a fingernail or toenail to relieve pressure, or draining fluid from a blister",
  "Eye patches",
  "Removing foreign bodies from the eye using only irrigation or a cotton swab",
  "Removing splinters or foreign material from areas other than the eye by irrigation, tweezers, cotton swabs or other simple means",
  "Finger guards",
  "Massage (physical therapy and chiropractic treatment are medical treatment)",
  "Drinking fluids for relief of heat stress",
];

// 1904.29(b)(7): the complete privacy case list.
export const PRIVACY_LIST = [
  "An injury or illness to an intimate body part or the reproductive system",
  "An injury or illness from a sexual assault",
  "Mental illness",
  "HIV infection, hepatitis or tuberculosis",
  "A needlestick or sharps cut contaminated with another person's blood or other potentially infectious material",
  "Another illness, if the employee voluntarily asks that their name not be entered",
];

export const FORM_301 = [
  "Employee details",
  "The physician or other health care professional, and where treatment was given if away from the worksite",
  "Whether the employee was treated in an emergency room",
  "Whether the employee was hospitalized overnight as an in-patient",
  "Case number from the 300 log",
  "Date of injury or illness and time of the event",
  "Time the employee began work",
  "Date of death, if any",
  "What the employee was doing just before the incident",
  "What happened",
  "What the injury or illness was",
  "What object or substance directly harmed the employee",
];

export const GLOSSARY = [
  ["Days away", "Calendar days, starting the day after the injury, that the employee could not work, or that a provider recommended they not work."],
  ["Restricted work", "The employee could not do one or more routine job functions (anything done at least once a week) or work a full workday, or a provider recommended that."],
  ["Job transfer", "The employee was moved to another job because of the injury or illness."],
  ["First aid", "Only the treatments on OSHA's first aid list. Anything else is medical treatment."],
  ["Medical treatment", "Managing or caring for an injury or illness with any treatment not on the first aid list, no matter who gives it."],
  ["Licensed health care professional", "A health care professional whose legally permitted scope of practice allows them to provide the care, such as a physician, nurse practitioner or physician assistant."],
  ["Establishment", "A single physical location where business is done or services are performed."],
  ["In-patient hospitalization", "Formal admission to a hospital or clinic for care or treatment. Observation or diagnostic testing alone does not count."],
  ["Privacy case", "A case where the employee's name is left off the 300 log and replaced with \"Privacy case.\""],
  ["NAICS code", "The North American Industry Classification System code for the establishment's industry."],
  ["Standard threshold shift (STS)", "An average hearing change of 10 dB or more from baseline at 2000, 3000 and 4000 Hz in either ear."],
  ["State plan", "An OSHA-approved state or territory program that runs its own workplace safety and health rules."],
];
