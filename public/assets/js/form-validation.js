$("#floatingEmail").on("change keydown paste input", (e) => {
  !isEmail(e.target.value) && e.target.value.length > 0
    ? $("#submitButton").addClass("disabled")
    : $("#submitButton").removeClass("disabled");
});

function isEmail(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}
