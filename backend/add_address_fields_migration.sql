-- applications
ALTER TABLE applications ADD COLUMN director_comment TEXT;
ALTER TABLE applications ADD COLUMN access_token TEXT;

-- form_duplicate_grade_card
ALTER TABLE form_duplicate_grade_card ADD COLUMN address_line1 TEXT;
ALTER TABLE form_duplicate_grade_card ADD COLUMN address_line2 TEXT;
ALTER TABLE form_duplicate_grade_card ADD COLUMN country TEXT;
ALTER TABLE form_duplicate_grade_card ADD COLUMN state_province TEXT;
ALTER TABLE form_duplicate_grade_card ADD COLUMN city TEXT;
ALTER TABLE form_duplicate_grade_card ADD COLUMN postal_code TEXT;

-- form_cgpa_conversion
ALTER TABLE form_cgpa_conversion ADD COLUMN address_line1 TEXT;
ALTER TABLE form_cgpa_conversion ADD COLUMN address_line2 TEXT;
ALTER TABLE form_cgpa_conversion ADD COLUMN country TEXT;
ALTER TABLE form_cgpa_conversion ADD COLUMN state_province TEXT;
ALTER TABLE form_cgpa_conversion ADD COLUMN city TEXT;
ALTER TABLE form_cgpa_conversion ADD COLUMN postal_code TEXT;

-- form_supplementary_exam
ALTER TABLE form_supplementary_exam ADD COLUMN address_line1 TEXT;
ALTER TABLE form_supplementary_exam ADD COLUMN address_line2 TEXT;
ALTER TABLE form_supplementary_exam ADD COLUMN country TEXT;
ALTER TABLE form_supplementary_exam ADD COLUMN state_province TEXT;
ALTER TABLE form_supplementary_exam ADD COLUMN city TEXT;
ALTER TABLE form_supplementary_exam ADD COLUMN postal_code TEXT;

-- form_repeat_paper
ALTER TABLE form_repeat_paper ADD COLUMN address_line1 TEXT;
ALTER TABLE form_repeat_paper ADD COLUMN address_line2 TEXT;
ALTER TABLE form_repeat_paper ADD COLUMN country TEXT;
ALTER TABLE form_repeat_paper ADD COLUMN state_province TEXT;
ALTER TABLE form_repeat_paper ADD COLUMN city TEXT;
ALTER TABLE form_repeat_paper ADD COLUMN postal_code TEXT;

-- form_duplicate_degree
ALTER TABLE form_duplicate_degree ADD COLUMN address_line1 TEXT;
ALTER TABLE form_duplicate_degree ADD COLUMN address_line2 TEXT;
ALTER TABLE form_duplicate_degree ADD COLUMN country TEXT;
ALTER TABLE form_duplicate_degree ADD COLUMN state_province TEXT;
ALTER TABLE form_duplicate_degree ADD COLUMN city TEXT;
ALTER TABLE form_duplicate_degree ADD COLUMN postal_code TEXT;

-- form_name_change
ALTER TABLE form_name_change ADD COLUMN address_line1 TEXT;
ALTER TABLE form_name_change ADD COLUMN address_line2 TEXT;
ALTER TABLE form_name_change ADD COLUMN country TEXT;
ALTER TABLE form_name_change ADD COLUMN state_province TEXT;
ALTER TABLE form_name_change ADD COLUMN city TEXT;
ALTER TABLE form_name_change ADD COLUMN postal_code TEXT;

-- form_retotaling
ALTER TABLE form_retotaling ADD COLUMN period_of_examination TEXT;
ALTER TABLE form_retotaling ADD COLUMN address_line1 TEXT;
ALTER TABLE form_retotaling ADD COLUMN address_line2 TEXT;
ALTER TABLE form_retotaling ADD COLUMN country TEXT;
ALTER TABLE form_retotaling ADD COLUMN state_province TEXT;
ALTER TABLE form_retotaling ADD COLUMN city TEXT;
ALTER TABLE form_retotaling ADD COLUMN postal_code TEXT;

-- form_on_request_degree
ALTER TABLE form_on_request_degree ADD COLUMN address_line1 TEXT;
ALTER TABLE form_on_request_degree ADD COLUMN address_line2 TEXT;
ALTER TABLE form_on_request_degree ADD COLUMN country TEXT;
ALTER TABLE form_on_request_degree ADD COLUMN state_province TEXT;
ALTER TABLE form_on_request_degree ADD COLUMN city TEXT;
ALTER TABLE form_on_request_degree ADD COLUMN postal_code TEXT;

-- form_migration_certificate
ALTER TABLE form_migration_certificate ADD COLUMN date_of_birth TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN email TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN Registration_Number TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN programme TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN address_line1 TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN address_line2 TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN country TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN state_province TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN city TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN postal_code TEXT;
ALTER TABLE form_migration_certificate ADD COLUMN delivery_preference TEXT;
