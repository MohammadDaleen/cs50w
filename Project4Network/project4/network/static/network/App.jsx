const { useState } = React;

function App() {
    const [state, setState] = React.useState({
        post: ""
    });

    function handleSubmit(event) {
        if (state.post.length !== 0) {
            fetch('/newPost', {
                method: 'POST',
                body: JSON.stringify({
                    post: state.post.trim()
                })
            })
            // Turn response to JSON (and name it result)
            .then(response => response.json())
            .then(result => {
                // Check for any error
                const noError = 'error' in result ? false : true;
                // Ensure result is true
                if (noError){
                // Load the user's sent mailbox
                }
                console.log("post sent to backend!")
                console.log(result)
                setState({
                    ...state,
                    post: ""
                });
            })
        }
        
        // Stop form from submitting
        if (event.type === "submit") {
            event.preventDefault();
        }
    }

    function handleChange(event) {
        setState({
            ...state,
            post: event.target.value
        });
    }

    // Publish the post if "Enter" button is pressed
    function handleKeyDown(event) {
        if (event.key === "Enter") {
            if (event.shiftKey) {
                event.preventDefault();
                setState({
                    ...state,
                    post: state.post + '\n'
                });
            }
            else {
                console.log(event);
                event.preventDefault();
                handleSubmit();
            }
        }
    }

    function handleKeyUp(event) {
        // Select the publish button to be used later
        const publish = document.querySelector('#publish');
        
        // Update publish button state when input is typed into the input field
        if (state.post.trim().length > 0) {
            publish.disabled = false;
        }
        else {
            publish.disabled = true;
        }
    }

    return (
        <>
            Hello, React!
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <textarea 
                        className="form-control" 
                        cols="40" 
                        rows="10" 
                        onChange={handleChange} 
                        onKeyDown={handleKeyDown} 
                        onKeyUp={handleKeyUp} 
                        placeholder="What's happening?!" 
                        required 
                        value={state.post}
                    />
                    <div className="pt-3">
                        <input id="publish" className="btn btn-primary" disabled type="submit" value="Publish" />
                    </div>
                </div>
            </form>
        </>
    );
}

ReactDOM.render(<App />, document.querySelector("#app"));