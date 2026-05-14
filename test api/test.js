
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCwQzaBQceZ4_4L6FhGZif5C6l41BmrqXQ");

async function run() {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash"
    });

    const result = await model.generateContent(
        "Explain bubble sort in C++"
    );

    console.log(result.response.text());
}

run();