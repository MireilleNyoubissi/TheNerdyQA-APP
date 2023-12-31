import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import About from "./pages/About";
import Home from "./pages/Home";
import AskQuestion from "./components/AskQuestionForm/AskQuestionForm";
import SelectedQtnThread from "./components/SelectedQtnThread/SelectedQtnThread";
import LoginMain from "./pages/LoginMain";
import { useDispatch, useSelector } from "react-redux";
import { authenticateUser } from "./auth";
import EditQuestionById from "./components/EditQuestion/EditQuestionById";



const App = () => {
	const dispatch = useDispatch();
	const { userId } = useSelector((state) => state);

	useEffect(() => {
		if(!userId){
			authenticateUser(dispatch);
		}
	},[userId, dispatch]);

	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/question/:id" element={<SelectedQtnThread />} />
			<Route path="/question/edit/:id" element={<EditQuestionById />} />
			<Route path="/loginMain" element={<LoginMain />} />
			<Route path="/ask-question" element={<AskQuestion />} />
			<Route path="/about/this/site" element={<About />} />
		</Routes>
	);
};
export default App;
