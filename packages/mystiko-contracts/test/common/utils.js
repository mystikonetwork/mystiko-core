export async function expectThrowsAsync(method, errorMessage) {
  let error;
  try {
    await method();
  } catch (err) {
    error = err;
  }
  expect(error).to.not.equal(undefined);
  if (errorMessage) {
    expect(error.toString()).to.equal(errorMessage);
  }
}
