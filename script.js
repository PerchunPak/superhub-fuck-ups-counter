function validateNum(a, b) {
  if (String(b).length > 5) return false;
  const result = a / 100 * b;
  const floored = Math.floor(result);
  return floored === result;
}

function findTheNum(a) {
	let b = 90.01;
	while (!validateNum(a, b)) {
		b = roundNumberToTwoPlacesAfterDot(b + 0.00000000001);
		if (b > 100) {
			return;
		}
	}
	return b;
}

function roundNumberToTwoPlacesAfterDot(num) {
	return Math.round((num + Number.EPSILON) * 10000000000) / 10000000000;
}

let num = 0;
while (true) {
	const percent = findTheNum(num);
	if (percent) {
		console.log(num, num - (num / 100 * percent), percent);
	}
	num += 1;
}
