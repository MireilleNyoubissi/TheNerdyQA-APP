import { Router } from "express";



import { registerUsers, getUsersByEmail } from "./data.js";
import jwt from "jsonwebtoken";
import pkg from "bcryptjs";
import db from "./db.js";
import JwtTokenCreator from "./jsonwebtoken.js";



const { hash, compare } = pkg;
const router = Router();
router.get("/", verifyToken, (req, res) => {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.sendStatus(403);
		} else {
			res.json({
				msg: "Hello, world!",
				authData,
			});
		}
	});
});

router.get("/users", (req, res) => {
	res.status(200).json(users);
});

router.post("/register", async (req, res) => {
	const { username, email, password } = req.body;
	try {
		if (!username || !email || !password) {
			res.status(400).json({ msg: "Please fill all fields" });
		} else {
			const user = await getUsersByEmail(email);
			if (user) {
				res.status(400).json({ msg: "email already registered" });
				//throw new Error("email already registered");
			} else {
				const hashedPassword = await hash(password, 10);
				await registerUsers(email, username, hashedPassword);
				res.status(200).json({ msg: "User created" });
			}
		}
	} catch (err) {
		console.log(err);
		throw new Error({ error: `${err}` });
	}
});

router.post("/login", async (req, res) => {
	const { email, password } = req.body;
	const data = await getUsersByEmail(email);
	console.log(email,password);
	console.log(data);

	try {
		if (data) {
			const valid = await compare(password, data.passwd);
		console.log(valid);
			if (valid) {
				const token = await JwtTokenCreator(data);
				res.cookie("token_id", token);
				req.session.userId = 12;
				res.json({
					msg: "Successfully logged in",
					userName: data.userName,
					email: data.email,
					userId: data.id,
					// userId: req.session.userId,
				});
			} else {
				res.status(400).json({
					msg: "Wrong password!",
				});
			}
		} else {
			res.status(400).json({
				msg: "User not found!",
			});
		}
	} catch (err) {
		res.status(400).json({ msg: `${err}` });
	}
});

//verify token
function verifyToken(req, res, next) {
	//get authentication header value
	const bearerHeader = req.headers["authorization"];
	//Check if bearer is undefined
	if (typeof bearerHeader !== "undefined") {
		//Split at the space
		const bearer = bearerHeader.split(" ");
		//Get token from array
		const bearerToken = bearer[1];
		//Set token
		req.token = bearerToken;
		//Next middleware
		next();
	} else {
		//Forbidden
		res.status(403).json({ msg: "not authorized!" });
	}
}

//get all questions
router.get("/questions", async (req, res) => {
	const questionsQuery = "SELECT questions.id, questions.title, questions.tried_content, questions.expected_content, questions.category, questions.user_id, questions.created_at, users.username FROM questions INNER JOIN users ON questions.user_id=users.id;";
		const result = await db.query(questionsQuery);
		res.json(result.rows);
});

const isValid = (n) => {
	return !isNaN(n) && n >= 0;
};

//get question by id
router.get("/questions/:id", async (req, res) => {
	const questionsId = req.params.id;
	const questionsById = `SELECT * FROM questions WHERE id=${questionsId}`;
	const checkIfExists = `select exists(select 1 from questions where id=${questionsId})`;
	if (!isValid(questionsId)) {
		res.status(400).json({ "Server message": "Invalid id!" });
	} else {
		db.query(checkIfExists).then((result) => {
			const exists = result.rows.map((el) => el.exists);
			let doesExist = exists.pop();
			if (!doesExist) {
				res.status(404).json({
					message: `A question by the id ${questionsId} does not exist!`,
				});
			} else {
				db.query(questionsById)
					.then((result) => res.json(result.rows))
					.catch((e) => console.error(e));
			}
		});
	}
});

//get answers by Question id
router.get("/answers/:id", async (req, res) => {
	const questionId = req.params.id;
	const answersByQId = `SELECT * FROM answers WHERE question_id=${questionId}`;
	const checkIfExists = `select exists(select 1 from questions where id=${questionId})`;
	if (!isValid(questionId)) {
		res.status(400).json({ "Server message": "Invalid id!" });
	} else {
		db.query(checkIfExists).then((result) => {
			const exists = result.rows.map((el) => el.exists);
			let doesExist = exists.pop();
			if (!doesExist) {
				res.status(404).json({
					message: `answers by the question id ${questionId} does not exist!`,
				});
			} else {
				db.query(answersByQId)
					.then((result) => res.json(result.rows))
					.catch((e) => console.error(e));
			}
		});
	}
});


// endpoint for post questions

router.post("/question", async (req, res) => {
	const category = req.body.category;
	const title = req.body.title;
	const tried_content = req.body.tried_content;
	const expected_content = req.body.expected_content;
	const user_id = req.body.userId;
	const created_at = new Date();
	const query =
		"INSERT INTO questions (category, title, tried_content, expected_content, user_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)";
	try {
		await db.query(query, [category, title, tried_content, expected_content, user_id, created_at]);
		res.status(201).send({ Success: "Your Question is Successfully Posted!" });
	} catch (error) {
		console.log(error);
		res.status(500).send(error);
	}
});

//endpoint for post answers

router.post("/answer", async (req, res) => {
	const { question_id, answer_content, userId, responder } = req.body;
	const createdAt = new Date();

	try {
		if(userId) {
			const query =
				"INSERT INTO answers (content, question_id, responder, user_id, created_at) VALUES ($1,$2,$3,$4,$5)";
			await db.query(query, [
				answer_content,
				question_id,
				responder,
				userId,
				createdAt,
			]);
		} else {
			const query =
				"INSERT INTO answers (content, question_id, responder, created_at) VALUES ($1,$2,$3,$4)";
			await db.query(query, [
				answer_content,
				question_id,
				responder,
				createdAt,
			]);
		}
		res.status(201).send({ Success: "Your Answer is Successfully Posted!" });
	} catch (error) {
		res.status(500).send(error);
	}
});

// endpoint delete questions

router.delete("/question/:id", async (req, res) => {
	const questionId = req.params.id;
	const deleteById = `DELETE FROM questions WHERE id=${questionId}`;
	const checkIfExists = `select exists(select 1 from questions where id=${questionId})`;
	if (!isValid(questionId)) {
		res.status(400).json({ "Server message": "Invalid id!" });
	} else {
		db.query(checkIfExists).then((result) => {
			const exists = result.rows.map((el) => el.exists);
			let doesExist = exists.pop();
			if (!doesExist) {
				res.status(404).json({
					message: `A question by the id ${questionId} does not exist!`,
				});
			} else {
				db.query(deleteById)
					.then(() =>
						res.json({
							message: `A question by the id ${questionId} is Successfully deleted!`,
						})
					)
					.catch((e) => console.error(e));
			}
		});
	}
});

//endpoint for delete answers
router.delete("/answer/:id", async (req, res) => {
	const answerId = req.params.id;
	const deleteById = `DELETE FROM answers WHERE id=${answerId}`;
	const checkIfExists = `select exists(select 1 from answers where id=${answerId})`;
	if (!isValid(answerId)) {
		res.status(400).json({ "Server message": "Invalid id!" });
	} else {
		db.query(checkIfExists).then((result) => {
			const exists = result.rows.map((el) => el.exists);
			let doesExist = exists.pop();
			if (!doesExist) {
				res.status(404).json({
					message: `A answer by the id ${answerId} does not exist!`,
				});
			} else {
				db.query(deleteById)
					.then(() =>
						res.json({
							message: `An answer by the id ${answerId} is Successfully deleted!`,
						})
					)
					.catch((e) => console.error(e));
			}
		});
	}
});

//endpoint get username
router.get("/username/:id/", function (req, res) {
	const questionId = req.params.id;
	const params = [questionId];
	db
	.query(
			"SELECT username FROM users INNER JOIN questions ON users.user_id = question.id INNER JOIN questions ON bookings.customer_id = customers.id WHERE customers.id = $1",
			params
		)
		.then((result) => res.json(result.rows))
		.catch((error) => {
			console.error(error);
			res.status(500).json(error);
		});
});

//Api endpoint for updating questions
router.patch("/questions", async (req, res) => {
    const title = req.body.title;
    const tried_content = req.body.tried_content;
	const expected_content = req.body.expected_content;
    const id = req.body.id;
    let questionUpdateQuery;
    if (!isValid(id)) {
        res.status(400).json({ "Server message": "Invalid id!" });
    } else if (title && isValid(id)) {
        questionUpdateQuery =
            "UPDATE questions SET title=$1, tried_content=$2, expected_content=$3 WHERE id=$4";
        try {
            await db.query(questionUpdateQuery, [title, tried_content, expected_content, id]);
            res.status(200).send({
                Success: "Your question including the title is successfully updated!",
            });
        } catch (error) {
			console.log(error);
            res.status(500).send(error);
        }
    } else if (!title && isValid(id)) {
        questionUpdateQuery = "UPDATE questions SET tried_content=$1, expected_content=$2 WHERE id=$3";
        try {
            await db.query(questionUpdateQuery, [tried_content, expected_content, id]);
            res.status(200).send({
                Success: "Your question is successfully updated!",
            });
        } catch (error) {
			console.log?(error):
            res.status(500).send(error);
        }
    }
});

//Api endpoint for updating answers
router.patch("/answers", async (req, res) => {
    const title = req.body.title;
    const content = req.body.content;
    const id = req.body.id;
    let questionUpdateQuery;
    if (!isValid(id)) {
        res.status(400).json({ "Server message": "Invalid id!" });
    } else if (title && isValid(id)) {
        questionUpdateQuery = "UPDATE answers SET title=$1, content=$2 WHERE id=$3";
        try {
            await db.query(questionUpdateQuery, [title, content, id]);
            res.status(200).send({
                Success: "Your answer including the title is successfully updated!",
            });
        } catch (error) {
            res.status(500).send(error);
        }
    } else if (!title && isValid(id)) {
        questionUpdateQuery = "UPDATE answers SET content=$1 WHERE id=$2";
        try {
            await db.query(questionUpdateQuery, [content, id]);
            res.status(200).send({
                Success: "Your answer is successfully updated!",
            });
        } catch (error) {
            res.status(500).send(error);
        }
    }
});

export default router;
