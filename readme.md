## 🛠️ Project Setup Guide for `agentic-chatbot`

### 1. **Clone the Repository**

If you're starting from a GitHub repository:

```bash
git clone https://github.com/MikeySharma/agentic-chatbot-weather.git
cd agentic-chatbot-weather
```

---

### 2. **Install Dependencies**

Use `npm` or `yarn` to install all dependencies:

```bash
npm install
# or
yarn install
```


### 3. **Run in Development Mode**

This command watches `.ts` files and reloads on change:

```bash
npm run dev
```

> Uses `nodemon` with `ts-node` to run `src/app.ts`

---

### 4. **Build the Project**

Transpile TypeScript into JavaScript in the `dist/` folder:

```bash
npm run build
```

---

### 5. **Start the Application**

After building, run the production server:

```bash
npm start
```

> Runs `node dist/app.js` after building the project

---

### 6. **Lint Your Code**

Run ESLint on `.ts` files to catch syntax or style issues:

```bash
npm run lint
```

---

### 7. **Environment Variables**

Create a `.env` file for environment-specific settings (like API keys):

```env
PORT=3000
OPENAI_API_KEY="your_key"
OPENWEATHER_API_KEY="your_key"
SERPAPI_API_KEY="your_key"
```

