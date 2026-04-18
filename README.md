# ArogyaDesk

ArogyaDesk is a simple desktop app for a doctor's clinic. It is designed for one doctor using one computer and keeps patient records on the local machine so the clinic can continue working without depending on the internet.

## What You Can Do

- Create and manage patient records
- Search patients by name or phone number
- Add visit history for each patient
- Record symptoms, diagnosis, prescription notes, charges, and discounts
- Attach local prescription or report files to a visit
- Export a visit receipt as PDF
- Keep doctor and clinic details inside the app

## Who It Is For

ArogyaDesk is best suited for:

- Small clinics
- Solo doctors
- Reception-plus-doctor workflows on one computer
- Offline-first record keeping

## System Requirements

- Windows computer
- Installer provided by the clinic or release page
- Permission to install a desktop application on the machine

## Installation

1. Download the latest `ArogyaDesk` Windows installer.
2. Double-click the installer `.exe` file.
3. Choose the installation folder if needed.
4. Finish the installation.
5. Launch `ArogyaDesk` from the Start menu or desktop shortcut.

## First-Time Setup

When you open the app for the first time, it will ask for clinic profile details.

Fill in:

- Doctor name
- Clinic name
- Specialization
- Phone number
- Clinic address
- Optional profile photo

After saving this profile, the app opens the main patient screen.

## Daily Use

### Add a New Patient

1. Open the app.
2. Click `New Patient`.
3. Enter the patient's details.
4. Save the record.

Typical patient fields:

- Full name
- Age
- Gender
- Phone number
- Address
- Notes
- Optional photo

### Search for a Patient

Use the search bar on the home screen to find a patient by:

- Name
- Phone number

### Open a Patient Profile

Click any patient card to open the patient profile. From there you can:

- Review patient information
- See total visits
- See total billed amount
- View visit history
- Edit patient details
- Delete the patient record

### Add a Visit

Inside a patient profile:

1. Click `Add Visit`.
2. Enter the visit date.
3. Add symptoms and diagnosis.
4. Write prescription notes if needed.
5. Add charges and discount.
6. Save the visit.

Visit records can include:

- Visit date
- Symptoms
- Diagnosis
- Prescription text
- Attached local document or image
- Charges
- Discount percentage
- Notes

### Edit or Delete a Visit

Open the visit entry from the visit history list, then use:

- `Edit`
- `Delete Visit`

### Export a Receipt PDF

From a saved visit:

1. Open the visit in the patient profile.
2. Click `Export PDF`.
3. Choose where to save the file.
4. The app will generate the PDF and open it.

## Attached Files

You can attach local files such as:

- PDF prescriptions
- Report images
- Scanned documents

Important:

- The app stores the file path, not a copy of the file
- If the original file is moved, renamed, or deleted, the app may no longer open it

It is best to keep clinic files in a fixed folder that is not moved frequently.

## Data Storage

ArogyaDesk stores its data locally on the same computer.

- Patient and visit data are saved in a local SQLite database
- The database file is created automatically by the app
- No internet connection is required for normal usage

## Backup Recommendation

Because the app is offline-first, backups are important.

You should back up:

- The local app database
- Any attached prescription or report files used by the clinic

Recommended backup routine:

1. Create a regular copy of the clinic data folder to an external drive or secure cloud storage.
2. Also back up any folders where prescription/report files are stored.
3. Keep at least one recent backup outside the clinic computer.

## Important Notes

- This app is intended for a single-user workflow
- It is not designed for multiple doctors editing the same data at the same time
- It does not sync automatically across multiple computers
- If you reinstall Windows or replace the computer, restore your backups before resuming clinic work

## Troubleshooting

### The app opens but no patient data is visible

Possible reasons:

- You are using a different computer or Windows user account
- The local database was not restored after reinstalling the system

### An attached file does not open

Possible reasons:

- The original file was moved
- The original file was renamed
- The original file was deleted

### A PDF receipt does not save

Check:

- You have permission to write to the selected folder
- The destination file is not already locked by another program

## Support Checklist

If you need help, keep this information ready:

- App version or installer version
- What action you were doing
- Whether the problem happens every time or only once
- Whether the issue is with patient data, attached files, or PDF export

## For Developers

This README is written for end users. Developer setup, packaging, and source structure should be documented separately if needed.
