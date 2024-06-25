const { useState, useEffect } = React;

function AllPosts(props) {
    return (
        <>
            {props.posts.map((post, index) => (
                <div key={index}>
                    <h4>{ post.poster }</h4>
                    <p>{ post.timestamp }</p>
                    <p>{ post.content }</p>
                    <p>Likes: { post.postLikes }</p>
                </div>
            ))}
        </>
    );
};