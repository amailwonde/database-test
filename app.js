const express = require("express");
const joi = require('joi');
const validate = require('express-validation');

const app = express();
const port  = "8080";

const db = require("knex")({
    client: "mysql",
    connection: {
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "wonde",
        charset: "utf8",
        timezone: "UTC"
    }
});

app.get("/", async (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(new Buffer('<a href="/students/2000-06-29">Test</a>'));
});

app.get("/students/:date", 

	validate({
		params: {
			date: joi.string().regex(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)
		}
	}),
        async (req, res) => {
        const date = new Date(req.params.date);
        const students = await db.table(`mis_people`).select('*')
            .where('date_of_birth', date);

        if (students.length === 0) {
            return res.json("No Student");
        }
            const studentsWithParents = await students.map(async (student) => {
                const parents = await db.table(`mis_person_contact`)
                    .select('mis_people.forename', 'mis_people.surname', 'mis_contact_details.email')
                    .where('mis_person_contact.person_id', student.id)
                    .join("mis_people", "mis_person_contact.contact_id", "=", "mis_people.id")
                    .join("mis_contact_details", "mis_contact_details.person_id", "=", "mis_people.id");
                student.parent = parents;
                return student;
                
            });
            Promise.all(studentsWithParents).then(data => res.json(data));
            
            
    });

app.listen( port, () => {
    console.log(`Running on http://0.0.0.0:${port}`);
});

/* SELECT * FROM mis_people WHERE id in (
    SELECT mis_person_contact.contact_id FROM mis_people 
        JOIN mis_person_contact ON mis_people.id = mis_person_contact.person_id
        where mis_people.id=19314655); */