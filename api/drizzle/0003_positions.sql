-- The roles a meeting can be for, picked from a list on the booking form.
INSERT INTO "position" ("name") VALUES
	('Software Engineer'),
	('Backend Developer'),
	('Frontend Developer'),
	('QA Engineer'),
	('Senior QA Engineer')
ON CONFLICT ("name") DO NOTHING;
