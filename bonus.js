/**
 * @param {number[]} nums
 * @return {number}
 */
const majorityElement = function (nums) {
  // Space O(1)
  let ans = -1,
    ctr = 0;

  // Time O(N)
  for (const num of nums) {
    if (!ctr) {
      ans = num;
      ctr++;
      continue;
    }

    num === ans ? ctr++ : ctr--;
  }

  return ans;
};
