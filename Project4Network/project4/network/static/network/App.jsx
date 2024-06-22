const { useState } = React;

function App() {
    const [state, setState] = React.useState({
        post: ""
    });

    function updatePost(event) {
        setState({
            ...state,
            post: event.target.value
        });
    }

    function inputKeyDown(event) {
        if (event.key === "Enter") {
            const post = parseInt(state.post);
            if (post !== "") {
                fetch('/newPost', {
                    method: 'POST',
                    body: JSON.stringify({
                        post: state.post
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
                })
            }
        }
    }

    return (
        <>
            Hello, React!
            <div className="form-group">
                <textarea className="form-control" cols="40" rows="10" onChange={updatePost} onKeyDown={inputKeyDown} placeholder="What's happening?!" required value={state.post} />
                <div className="pt-3">
                    <input className="btn btn-primary" type="submit" value="Publish" />
                </div>
            </div>
        </>
    );
}

ReactDOM.render(<App />, document.querySelector("#app"));