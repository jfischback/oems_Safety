# **Recordability Determination Tool: Build Spec**

**Owner:** Jonathan Fischback, OEMS. **Status:** Draft for review, revised November 5, 2026 after the second-pass and V2 audits. **Builder:** Claude Code.

## **Purpose**

A web page that walks a user through OSHA's recordkeeping rules one question at a time and tells them whether a work injury or illness is recordable, why, and what goes on the OSHA 300 log. It also lists the actions and deadlines the regulations require. The tool predicts; the employer makes the final recording decision.  
The logic follows federal OSHA, 29 CFR Part 1904\. Every question and every result shows the paragraph it comes from. The tool does not make up rules. Where the regulation leaves a judgment call, the tool says so and marks the case "Needs review" instead of guessing.  
The tool answers three separate questions and never lets one stand in for another: does the case meet OSHA's recording criteria; is this employer required to keep OSHA 300 and 301 records; and must the event be reported to OSHA right away under 1904.39. An employer that is exempt from keeping logs must still report severe events. Every result is labeled Federal OSHA baseline. The first question asks which state the incident happened in. If it is a state-plan state (Arizona is one), the results show a prominent warning: Federal baseline only; verify the state plan's recordkeeping and reporting rules.

## **Hard requirements**

> * Web-based, single page, works on a phone and a desktop.  
> * Saves nothing. No cookies, localStorage, sessionStorage, IndexedDB, server, database, analytics, or tracking. No entered data is ever sent over the network.  
> * Everything the user enters lives only in the open page. Closing the tab or window, or refreshing, erases it.  
> * Switching to another tab or window and coming back keeps the user's place.  
> * The tool never asks for the employee's name. Results show "\[Employee name\]" or "Privacy case" where the name would go.  
> * One question per screen, with Back and Next buttons that keep the user's answers, and a progress bar showing the sections: Employer, Worker, Case, Criteria, Reporting, Results. A short plain-language glossary explains terms such as restricted work and days away.  
> * Each question has a short "Why we ask" note with the regulation citation.  
> * Questions that do not apply are skipped. Changing an earlier answer clears any later answers that depended on it.  
> * Every question offers Yes, No and Not sure. Not sure never counts as No; it leads to a follow-up question or a Needs review result.  
> * Results page buttons: Copy summary, Copy full determination, and Print summary. Copying or printing is the user's own action; the tool itself still saves nothing. A one-line note next to the buttons says the copy leaves the tool. The tool never asks for names or free-text descriptions, so there is nothing identifying to copy.  
> * Keyboard access, screen-reader support, layouts that work on any screen size, and clear error messages.  
> * The regulatory rules are kept in their own file, separate from the screens, and each rule carries its CFR citation. Each rule is marked as coming from the regulation or from an OSHA interpretation letter or FAQ. The results page shows a Rules last reviewed date.

## **Disclaimer**

Where it appears: the start screen shows the short version with an I understand button the user must click before the first question. The full version is one click away on every screen. The short version also appears at the bottom of the results page and in every copied or printed summary. Clicking I understand is not saved anywhere. Before the tool goes public, have an attorney review this text; how much the no-warranty and liability sections protect OEMS depends on state law.  
**Short version:** This tool is an informational aid based on federal OSHA recordkeeping rules (29 CFR Part 1904). It is not legal or medical advice. Results depend entirely on the answers you enter. Your employer is responsible for the final recording and reporting decisions. If a worker has died, been admitted to a hospital, lost an eye, or had an amputation, report it to OSHA now at 1-800-321-OSHA (6742) or osha.gov/report.  
**Full version:**  
**Purpose.** The OEMS Recordability Determination Tool helps users work through the federal OSHA injury and illness recordkeeping and reporting rules in 29 CFR Part 1904\. It provides general information and a predicted result based only on the answers entered. It does not make recordkeeping or reporting decisions for any employer.  
**Not legal advice.** The tool and its results are not legal advice. Using the tool does not create an attorney-client, consulting or other professional relationship with OEMS or its staff. For advice about a specific situation, consult a qualified OSHA recordkeeping professional, an attorney, or your OSHA Area Office.  
**Not medical advice.** The tool does not diagnose, treat or evaluate any injury or illness. Diagnoses, treatment decisions and work restrictions come from physicians and other licensed health care professionals, and the tool relies on the user's description of them.  
**Employer responsibility.** Each employer is solely responsible for deciding whether a case is recorded, completing the OSHA 300, 300A and 301 forms or their equivalents, meeting every deadline, and reporting fatalities, in-patient hospitalizations, amputations and losses of an eye to OSHA. A result from this tool does not relieve an employer of any of these duties and is not a defense to an OSHA citation.  
**Accuracy depends on your answers.** The result is only as accurate and complete as the information entered. Missing, incorrect or changed facts can change the result. Recordability often depends on specific facts, provider opinions and OSHA interpretations that the tool cannot verify. When the tool returns Needs review, the case requires judgment the tool cannot supply.  
**Federal rules only.** The tool applies federal OSHA rules. States and territories with OSHA-approved state plans, including Arizona, may have recordkeeping and reporting requirements that differ from or add to the federal rules. The tool does not determine compliance with any state plan.  
**Rules can change.** The tool reflects 29 CFR Part 1904 and the OSHA interpretations cited in it as of the Rules last reviewed date shown on the results page. Regulations, forms, FAQs and interpretations may change after that date, and the tool may not reflect those changes.  
**Nothing is reported to OSHA.** The tool does not report anything to OSHA, does not submit records electronically, and does not keep a log. Reporting and submission are the employer's responsibility. If an event may be reportable, do not wait on this tool: report within the required time.  
**Privacy.** The tool does not save, store or transmit anything you enter. Your answers exist only in the open browser page and are erased when you close or refresh it. The tool never asks for names or other identifying information; do not enter any. Any copy you make with the Copy or Print buttons, or by other means, leaves the tool and is your responsibility to protect.  
**No warranty.** The tool is provided as is and as available, without warranties of any kind, express or implied, including warranties of accuracy, completeness, fitness for a particular purpose, or that results will be free of errors.  
**Limitation of liability.** To the fullest extent permitted by law, OEMS and its owners, employees and contributors are not liable for any citation, penalty, loss, damage, cost or claim arising from use of, or reliance on, the tool or its results.  
**Acceptance.** By clicking I understand and using the tool, the user accepts these terms.

## **Question flow**

The order follows OSHA's own decision flow in 1904.4. A "No" or an exception ends the recordability questions with "Not recordable" and the reason. The tool marks a case Not recordable only when every path to recording has been ruled out; an open question about work-relatedness or whether it is a new case keeps the result at Needs review. It never skips the employer applicability questions, and it never skips the report-to-OSHA check for a work-related case. A Not sure answer never counts as No: it leads to a follow-up question or a Needs review result.

### **Employer applicability (1904.1 and 1904.2)**

1. Did the whole company, counting every location, have 10 or fewer employees at all times during the last calendar year (not the current year)? If yes, the company does not have to keep routine OSHA 300 and 301 records (1904.1).  
2. Is this establishment's NAICS code in an industry listed in Appendix A to Subpart B of Part 1904? If yes, this establishment does not have to keep routine OSHA 300 and 301 records (1904.2). This test is per establishment, and the tool includes the list with the date it was last checked. If the NAICS code is unknown, the result is Needs review until it is verified.  
3. Has OSHA or the Bureau of Labor Statistics asked the company in writing to keep records, for example for a BLS survey? If yes, the exemption does not apply (1904.41 and 1904.42).

Being exempt only changes the log answer. The tool still decides whether the case meets the recording criteria, and it always runs the report-to-OSHA check, because every employer must report severe events.

### **Covered employee (1904.31)**

> 1. Who supervises this worker day to day? If you do, continue; the case goes on your log, whether the worker is on your payroll or is a temporary, leased or contract worker.  
> 2. If another employer supervises them day to day (for example a staffing agency employee working under a client's supervision, or a contractor's employee), result: Not your OSHA 300 entry; coordinate with the employer that supervises the worker, which records it. This is not the same as Not recordable, and the tool still finishes the recordability and report-to-OSHA checks so you can share them with that employer. Payroll alone does not decide. Coordinate with the other employer so the case is recorded only once (1904.31).  
> 3. Assign the case to the right establishment: if it happened at one of your establishments, record it on that establishment's log; if it happened away from all of them (travel, work at home, field work), record it on the log of the establishment where the employee normally works (1904.30).

### **Injury or illness (1904.46)**

> 1. Did the employee have an injury or illness, meaning an abnormal condition or disorder such as a cut, sprain, burn, fracture, or an acute or chronic illness? If no, result: not recordable.

### **Work-relatedness (1904.5)**

> 1. Did an event or exposure in the work environment cause or contribute to it, or significantly aggravate a pre-existing condition? The work environment is the establishment and any other place the employee works or is present as a condition of employment (1904.5(b)(1)). If no, result: not recordable.  
> 2. Does any of these exceptions apply? (1904.5(b)(2)) If yes, result: not recordable, with the exception named.  
   * The person was present as a member of the general public, not as an employee.  
   * Symptoms appeared at work but came solely from a non-work event or exposure.  
   * It came solely from voluntary participation in a wellness, medical, fitness or recreational activity (for example a flu shot or exercise class).  
   * It came solely from eating, drinking or preparing food for personal consumption. Not an exception if the employee is made ill by food contaminated by workplace contaminants (such as lead) or gets food poisoning from food the employer supplied.  
   * It came solely from personal tasks outside assigned working hours.  
   * It came solely from personal grooming, self-medication for a non-work condition, or was intentionally self-inflicted.  
   * A motor vehicle accident in a company parking lot or on a company access road while commuting.  
   * Common cold or flu.  
   * Mental illness, unless the employee voluntarily gives a physician's or licensed health care professional's opinion that it is work-related.  
> 3. Was the employee traveling for work? If yes, it is work-related only if the employee was doing work in the interest of the employer. Once the employee checks into a hotel or other temporary residence, they have left the work environment, so judge what they were doing the same way as for an employee who is not traveling. Not work-related: commuting between the temporary residence and a fixed job location, or a personal side trip off a reasonably direct route of travel (1904.5(b)(6)).  
> 4. Was the employee working at home? If yes, ask: did it come directly from the work (for example, dropping a box of work documents) rather than the general home environment? If no, result: not recordable (1904.5(b)(7)).  
> 5. Was there a pre-existing condition, meaning one that came solely from a non-work event or exposure (1904.5(b)(5))? If yes, the aggravation counts as significant only if the work event caused one of these that would not otherwise have happened: death, loss of consciousness, days away or restricted work or job transfer, or new or changed medical treatment (1904.5(b)(4)). If none, result: not recordable.

### **New case (1904.6)**

> 1. Has this employee already had a recorded case of the same type to the same body part? If no, it is a new case.  
> 2. If yes: had they fully recovered (all signs and symptoms gone) before a new workplace event or exposure brought it back? If yes, it is a new case. If no, result: not a new case; update the existing log entry instead.  
> 3. For a chronic illness that can recur without new exposure (for example silicosis or occupational cancer), record it only once (1904.6(b)(1)).  
> 4. If a physician or licensed health care professional gave an opinion on new versus recurring, follow it (1904.6(b)(3)).

### **Special cases (1904.8 to 1904.11)**

Ask whether the case involves any of these. Each one has its own rule and skips the general criteria where the rule says so.

> * **Needlestick or cut from a sharp contaminated with another person's blood or other potentially infectious material:** recordable as an injury, and a privacy case (1904.8). A cut from an uncontaminated sharp goes through the general criteria. If no one knows whether the sharp was contaminated, the result is Needs review, not uncontaminated. A splash with no cut is recorded only if it leads to a bloodborne illness diagnosis or meets the general criteria.  
> * **Hearing loss found on an audiogram:** recordable if there is a standard threshold shift (an average change of 10 dB or more from baseline at 2000, 3000 and 4000 Hz in either ear) and the employee's total hearing level in that ear is 25 dB or more above audiometric zero, averaged at the same frequencies. Age correction may be used for the shift but not for the 25 dB test. A retest within 30 days that does not confirm the shift means it need not be recorded. It must also be work-related under 1904.5; if a physician or licensed health care professional determines it is not work-related, or that work noise did not significantly aggravate it, it is not recorded. Check the hearing loss column (1904.10). The tool calculates this from numbers the user enters for each ear separately: baseline and current hearing levels at 2000, 3000 and 4000 Hz, plus age and sex if the user chooses the age correction (Appendix F of 1910.95), and the retest date and result if there was one. The results show the math for each ear: baseline and current levels, the unadjusted change, the age-adjusted change if used, and the unadjusted current average for the 25 dB test. The tool also asks whether the baseline audiogram was ever revised, measures the 30-day retest window from the first audiogram date, and returns Needs review if any number is missing. If later testing shows the shift is not persistent, the entry may be lined out.  
> * **Tuberculosis:** recordable if the employee was exposed at work to a known case of active TB and then has a positive skin test or a diagnosis. Check the respiratory condition column. Not recorded if the employee lives with someone with active TB, public health identified them as a contact of an unrelated case, or a medical investigation shows the infection came from outside work. A positive pre-employment test is not recordable (1904.11).  
> * **Medical removal under an OSHA standard** (for example lead, cadmium, benzene, formaldehyde, methylene chloride): recordable as a days-away or restricted case depending on how the removal is done; check the poisoning column if it came from a chemical exposure. A voluntary removal before the standard's removal levels are reached is not recorded under this rule, but the case still goes through the general criteria (1904.9). The tool asks which standard applies and whether the employee was kept off work entirely or moved to other work or restricted.

### **General recording criteria (1904.7)**

Ask these in order. The first "Yes" makes the case recordable, but keep asking so the tool can pick the most serious outcome for the log.

> 1. **Death?** (1904.7(b)(2))  
> 2. **Days away from work?** Do not count the day of the injury. A physician's recommendation of days away counts even if the employee came to work anyway (1904.7(b)(3)).  
> 3. **Restricted work or job transfer?** The tool asks whether the employee can do every routine job function and work the full scheduled workday, counting restrictions the employer imposed, restrictions a provider recommended, and job transfers. Restricted means the employee was kept from one or more routine job functions (anything they do at least once a week) or from a full workday, or a physician or licensed health care professional recommended that. A restriction only on the day of injury does not count. Producing less while doing all routine functions for a full shift does not count. If a restriction is vague and the provider cannot clarify, record it as restricted (1904.7(b)(4)(vii)). The result is Recordable, with a note to document the attempt to get clarification.  
> 4. **Medical treatment beyond first aid?** Show OSHA's complete first aid list as a checklist. Any treatment not on the list is medical treatment, no matter who gives it. Visits only for observation or counseling, and diagnostic tests such as X-rays and blood tests, are not treatment. Treatment that was recommended but refused still counts (1904.7(b)(5)(v)). A medical visit by itself is not recordable. The tool asks separate questions about treatment actually given; treatment a physician or licensed health care professional recommended; prescription medication, including over-the-counter medication at prescription strength; medication used only for diagnosis; observation or counseling; how a wound was closed; rigid or non-rigid supports; physical therapy or chiropractic care versus massage; and immunizations. These questions show short examples for the common traps, such as an over-the-counter dose at label strength versus prescription strength, Steri-Strips versus skin glue, and an elastic wrap versus a brace with rigid stays.  
>    First aid list (1904.7(b)(5)(ii)), complete:  
   * Non-prescription medication at non-prescription strength (prescription strength means more than the single dose on the over-the-counter label; OSHA FAQ 7-8).  
   * Tetanus immunizations (other immunizations are medical treatment).  
   * Cleaning, flushing or soaking surface wounds.  
   * Wound coverings such as bandages, gauze pads, butterfly bandages or Steri-Strips (sutures and staples are medical treatment under the rule; OSHA's August 26, 2004 interpretation letter says medical glue is too).  
   * Hot or cold therapy.  
   * Non-rigid support such as elastic bandages, wraps, or non-rigid back belts (devices with rigid stays or that immobilize a body part are medical treatment).  
   * Temporary immobilization while transporting a victim (splints, slings, neck collars, back boards).  
   * Drilling a fingernail or toenail to relieve pressure, or draining fluid from a blister.  
   * Eye patches.  
   * Removing foreign bodies from the eye using only irrigation or a cotton swab.  
   * Removing splinters or foreign material from areas other than the eye by irrigation, tweezers, cotton swabs or other simple means.  
   * Finger guards.  
   * Massage (physical therapy and chiropractic treatment are medical treatment).  
   * Drinking fluids for relief of heat stress.  
> 5. **Loss of consciousness,** for any length of time? (1904.7(b)(6))  
> 6. **Significant diagnosis** by a physician or licensed health care professional: cancer, chronic irreversible disease, a fractured or cracked bone, a punctured eardrum, or a chipped, broken or fractured tooth? Recordable at diagnosis even with no treatment or work restriction (1904.7(b)(7)). Teeth come from OSHA's November 12, 2015 interpretation letter, which treats a diagnosed chipped or broken tooth like a fracture.

If all answers are "No," result: not recordable.

### **Report to OSHA check (1904.39)**

Ask this for every work-related case, whether or not it is recordable and whether or not the employer is exempt from keeping logs. A known reportable event shows an urgent notice at the top of the results, even if other questions are still unanswered. The tool asks for four separate dates and times: the incident; the death, hospitalization, amputation or eye loss; when you or your agent learned of that outcome; and when you learned it was work-related. When you learn of the outcome and of its work-relatedness at different times, the clock starts at whichever came later. The occurrence windows (30 days for a death, 24 hours for the other events) are always measured from the incident. The tool never guesses a missing date or time; it shows what started the clock and the deadline in local time.

> 1. Did the employee die within 30 days of the incident? If yes, report within 8 hours of the death. If you learn of the death later, or learn later that it was work-related, the 8 hours start when you or your agent learn it (1904.39(a)(1), (b)(7) and (b)(8)).  
> 2. Within 24 hours of the incident, was there an in-patient hospitalization (formal admission for care or treatment, not only observation or diagnostic testing), an amputation (including a fingertip; not an avulsion, degloving, scalping, severed ear or broken tooth), or loss of an eye? If yes, report within 24 hours of the event. If you learn of it later, or learn later that it was work-related, the 24 hours start when you or your agent learn it (1904.39(a)(2), (b)(7) and (b)(8)).  
> 3. Exceptions: not reportable if it happened in a motor vehicle accident on a public street or highway outside a construction work zone, or on a commercial or public transportation system such as a plane, train or bus. A reporting exception does not decide whether the case is recordable; the tool evaluates that separately.  
> 4. How to report: call or visit the nearest OSHA Area Office, call 1-800-321-OSHA (6742), or use the online report form on osha.gov. Voicemail, fax and email do not count.

## **Results page**

### **Determination**

The results page shows separate sections for recordability, whether the employer must keep the log, the report-to-OSHA check, the OSHA 300 entry and day counts, deadlines, and any facts still unknown, plus a Facts as of date and time. If facts change later (a death, hospitalization, new diagnosis or new restriction), the user runs the tool again with the new facts, and the results remind them to update the existing log entry rather than start a new case. Recordability is one of three results, each with a plain-language reason and the citation for every answer that drove it:

> * **Recordable**  
> * **Not recordable**  
> * **Needs review:** the answers hit a gray area (see Gray areas below). The page names the issue and links to OSHA's recordkeeping interpretation letters and FAQs.

### **OSHA 300 log entry**

Shown only for recordable cases. The tool fills what it knows and tells the user what to enter for the rest.

| Column | What the tool shows |
| :---- | :---- |
| (A) Case no. | "Next number on your log." |
| (B) Employee's name | "Privacy case" if the case is on the privacy list in 1904.29(b)(7); otherwise "\[Employee name\]." |
| (C) Job title | "\[Job title\]." |
| (D) Date of injury or onset | The date the user entered. |
| (E) Where the event occurred | "\[Location\]." |
| (F) Description | A prompt for the three things OSHA wants: the injury or illness, the body part, and the object or substance. For privacy cases, a note that the description can leave out private details but must still state the cause and general severity (1904.29(b)(9)). |
| (G) to (J) Outcome | Exactly one box, the most serious outcome: Death, then Days away, then Job transfer or restriction, then Other recordable case. If the case later becomes more serious, the box changes to the more serious outcome. |
| (K) Days away / (L) Days restricted | Two separate counts from dates the user enters, with no day counted twice; both columns can have days. Count calendar days starting the day after the injury, including weekends, holidays and other days the employee would not have worked anyway. A provider's recommendation counts even if the employee does not follow it, and a provider's return-to-work date ends the count even if the employee stays out. Counting may stop if the employee leaves for a reason unrelated to the case, or when a job is permanently modified (at least one restricted day still counts). Days away and restricted days together may be capped at 180\. If a case reaches 180 restricted days and then becomes days away, enter 180 restricted, optionally 1 day away, and check the days-away box (OSHA FAQ 7-18). The case stays on the log for the year it happened. Inputs: injury date; the date ranges a provider recommended days away or restriction; what the employee actually did; the provider's return-to-work date; any permanent job modification date; and any unrelated separation date. The results list each counted date range, how the 180-day cap was applied, and any conflicting provider directions. If the case is still open, the tool says to enter an estimate and update it (1904.7(b)(3) and (b)(4)). |
| (M) Injury or illness type | One of: Injury, Skin disorder, Respiratory condition, Poisoning, Hearing loss, All other illnesses. Set automatically for special cases (needlestick: injury; hearing loss; TB: respiratory; chemical medical removal: poisoning); otherwise the user picks, using OSHA's test: a case from an instantaneous event or exposure is an injury, and anything else is an illness (OSHA recordkeeping FAQ at osha.gov/faq/389). |

Privacy cases (1904.29(b)(7)), complete list: injury or illness to an intimate body part or the reproductive system; injury or illness from a sexual assault; mental illness; HIV infection, hepatitis or tuberculosis; needlesticks and sharps cuts contaminated with another person's blood or other potentially infectious material; other illnesses if the employee voluntarily asks that their name not be entered. The separate confidential list of names must still be given to the government if it asks; a privacy case keeps the name off the log that employees can see, not away from OSHA.

### **OSHA 301 reminder**

A checklist taken from the actual OSHA Form 301 (or an equivalent form): employee details, the physician or provider and where treatment was given, whether the employee went to the emergency room or was admitted overnight, case number, date and time of the event, time work began, date of death if any, what the employee was doing, what happened, what the injury or illness was, and what object or substance caused it.

### **Required actions and deadlines**

Only actions the regulations require. Each shows only when it applies.

> * Enter the case on the 300 log and complete the 301 within 7 calendar days of learning about it (1904.29(b)(3)).  
> * Report to OSHA within 8 hours (fatality) or 24 hours (in-patient hospitalization, amputation, loss of an eye) (1904.39).  
> * Privacy case: keep a separate, confidential list of case numbers and names (1904.29(b)(6)).  
> * Keep updating days away or restricted until the employee is back to full duty or the count reaches 180 (1904.7(b)(3)).  
> * Hearing loss: a retest within 30 days that does not confirm the shift lets you leave it off; a confirmed shift is recorded within 7 days of the retest (1904.10).  
> * Needlestick: if the employee is later diagnosed with a bloodborne illness, update the entry and change it from an injury to an illness (1904.8).  
> * After year end: a company executive certifies the 300A summary, which is posted from February 1 to April 30 (1904.32). Electronic submission is not required of everyone (1904.41). By March 2, an establishment with 20 to 249 employees in an industry listed in Appendix A to Subpart E submits the 300A; an establishment with 250 or more employees that must keep records submits the 300A; and an establishment with 100 or more employees in an industry listed in Appendix B to Subpart E also submits its 300 and 301 data. Size is based on the establishment's employees during the previous calendar year. The submission needs the Employer Identification Number (EIN), and OSHA does not collect employee names and addresses, health care professionals' names, or treatment facility names and addresses.  
> * Keep the 300, 300A, 301 and privacy list for 5 years after the end of the year. During that time, keep the 300 log updated with newly discovered cases and changes in classification; the 300A and 301 do not have to be updated (1904.33).  
> * Employee access (1904.35): the 300 log to an employee, former employee, personal representative or authorized employee representative by the end of the next business day; an employee's own 301 to that employee or their personal representative by the end of the next business day; the case description section of the 301s to an authorized employee representative within 7 calendar days.  
> * Give copies of the records within 4 business hours when an authorized government representative asks, including OSHA, NIOSH or a state-plan agency (1904.40).

## **Gray areas the tool flags as "Needs review"**

> * A medication given or recommended where it is unclear whether the dose is above the over-the-counter label's single dose.  
> * A pre-existing condition where it is unclear whether the work event caused one of the significant-aggravation outcomes.  
> * Conflicting opinions from two or more providers (the employer chooses the most authoritative one; 1904.6(b)(3) and 1904.7(b)(3)).  
> * A hospital visit where it is unclear whether the employee was formally admitted for treatment or only kept for observation.  
> * An injury where it is unclear whether it was an amputation or an avulsion or degloving.  
> * Any answer of "Not sure" on a question. Every question offers "Not sure."

## **Testing before release**

Claude Code builds a set of test incidents with known answers. They cover every general recording criterion, each work-relatedness exception, new versus recurring cases, each special case, employer exemptions, the report-to-OSHA check and its clocks, privacy cases, day counting (including the 180-day cap and OSHA FAQ 7-18), conflicting provider opinions, and Not sure answers. Each test lists the facts entered and the expected recordability result, log requirement, reporting requirement, 300 classification, day counts, citations and deadlines. Each rule gets an ID, its citation, and the tests that check it. Tests include yes, no, Not sure, conflicting and changed-answer cases, plus the reporting deadline and 180-day boundaries. Do not publish the tool until every test passes and a qualified OSHA recordkeeping professional has reviewed the test set.

## **Not in this tool**

> * Company actions beyond what OSHA requires, such as incident investigation, root cause, return-to-work, or internal notifications. These come from Jonathan's program and will be added when he supplies them.  
> * State-plan rules that differ from federal OSHA.  
> * Submitting anything to OSHA, or keeping the log itself.

## **Open questions for Jonathan**

> * What company actions, if any, should the results page list after the OSHA-required actions?  
> * Web address: under your one-subdomain-per-topic convention, should this be safety.oemsgroup.com/recordability\_tool, or something else?  
> * GitHub repo: your existing oems\_Safety repo. Confirm that is where it should go.

## **Sources**

> * [29 CFR 1904.5, Determination of work-relatedness](https://www.law.cornell.edu/cfr/text/29/1904.5)  
> * [29 CFR 1904.6, Determination of new cases](https://www.law.cornell.edu/cfr/text/29/1904.6)  
> * [29 CFR 1904.7, General recording criteria](https://www.law.cornell.edu/cfr/text/29/1904.7)  
> * [29 CFR 1904.8, Needlestick and sharps injuries](https://www.law.cornell.edu/cfr/text/29/1904.8)  
> * [29 CFR 1904.9, Medical removal](https://www.law.cornell.edu/cfr/text/29/1904.9)  
> * [29 CFR 1904.10, Occupational hearing loss](https://www.law.cornell.edu/cfr/text/29/1904.10)  
> * [29 CFR 1904.11, Tuberculosis](https://www.law.cornell.edu/cfr/text/29/1904.11)  
> * [29 CFR 1904.29, Forms](https://www.law.cornell.edu/cfr/text/29/1904.29)  
> * [29 CFR 1904.39, Reporting to OSHA](https://www.law.cornell.edu/cfr/text/29/1904.39)  
> * [29 CFR Part 1904, full text (1904.31, 1904.32, 1904.33, 1904.35)](https://www.govinfo.gov/content/pkg/CFR-2016-title29-vol5/pdf/CFR-2016-title29-vol5-part1904.pdf)  
> * [OSHA Recordkeeping FAQ 7-8, prescription strength](https://osha.gov/faq/7-8)  
> * [OSHA interpretation letter, August 26, 2004, medical glue](https://www.osha.gov/laws-regs/standardinterpretations/2004-08-26)  
> * [OSHA Recordkeeping FAQ, injury versus illness](https://www.osha.gov/faq/389)  
> * [OSHA Forms 300, 300A and 301 with instructions](https://www.bls.gov/respondents/iif/forms/oshaforms.pdf)  
> * [29 CFR 1904.1, size exemption](https://www.law.cornell.edu/cfr/text/29/1904.1)  
> * [29 CFR 1904.2, partially exempt industries](https://www.law.cornell.edu/cfr/text/29/1904.2)  
> * [29 CFR 1904.30, multiple business establishments](https://www.law.cornell.edu/cfr/text/29/1904.30)  
> * [29 CFR 1904.33, retention and updating](https://www.law.cornell.edu/cfr/text/29/1904.33)  
> * [29 CFR 1904.35, employee involvement and access](https://www.law.cornell.edu/cfr/text/29/1904.35)  
> * [29 CFR 1904.40, providing records to government representatives](https://www.law.cornell.edu/cfr/text/29/1904.40)  
> * [Final rule amending 1904.41, electronic submission (Federal Register, July 21, 2023\)](https://www.osha.gov/laws-regs/federalregister/2023-07-21)  
> * [OSHA Recordkeeping FAQ 7-18, 180-day cap](https://www.osha.gov/faq/7-18)  
> * [OSHA interpretation letter, November 12, 2015, chipped or broken teeth](https://www.osha.gov/laws-regs/standardinterpretations/2015-11-12)