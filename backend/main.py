import uvicorn

if __name__ == "__main__":
    # Run the FastAPI app from the app/ directory
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
