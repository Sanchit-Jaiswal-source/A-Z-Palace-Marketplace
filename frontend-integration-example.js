// Example: connect your existing A-Z Palace frontend to the backend.
//
// GET products:
// fetch("http://localhost:5000/api/products?search=gaming")
//   .then(r => r.json())
//   .then(data => console.log(data.products));
//
// Register:
// fetch("http://localhost:5000/api/auth/register", {
//   method: "POST",
//   headers: {"Content-Type": "application/json"},
//   body: JSON.stringify({
//     name: "Your Name",
//     email: "you@example.com",
//     password: "password123"
//   })
// });
//
// After login, save the returned token and send it as:
// Authorization: Bearer <token>
