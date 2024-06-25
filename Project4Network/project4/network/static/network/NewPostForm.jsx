const { useState } = React;

function NewPostForm(props) {
    const [state, setState] = useState({
        post: ""
    });

    function handleSubmit(event) {
        props.onNewPost(state.post);
        setState({
            ...state,
            post: ""
        });
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
                event.preventDefault();
                handleSubmit(event);
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