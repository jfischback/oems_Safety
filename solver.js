// Solve a calculator for the one variable left blank.
// values: { key: number } for every variable except the blank one.
// Returns { key, value } or throws an Error with a plain message.

export function solveBlank(calc, values) {
  const blanks = calc.vars.filter(v => values[v.k] === undefined || values[v.k] === null || Number.isNaN(values[v.k]));
  if (blanks.length === 0) throw new Error("Leave one box blank. That is the value the calculator will solve for.");
  if (blanks.length > 1) throw new Error(`Fill in every box except one. ${blanks.length} boxes are blank.`);
  const key = blanks[0].k;
  let value;
  if (calc.solve[key]) {
    value = calc.solve[key](values);
  } else {
    value = solveNumeric(x => calc.residual({ ...values, [key]: x }));
  }
  if (!Number.isFinite(value)) throw new Error("These numbers have no valid answer. Check the inputs.");
  return { key, value };
}

// List calculators (calc.list) take any number of readings and always compute calc.result.
export function computeList(calc, values) {
  if (Object.keys(values).length === 0) throw new Error("Enter at least one reading.");
  const value = calc.compute(values);
  if (!Number.isFinite(value)) throw new Error("These numbers have no valid answer. Check the inputs.");
  return { key: calc.result.k, value };
}

// Finds a positive root of f by scanning for a sign change, then bisecting.
// Used only where the equation cannot be rearranged algebraically.
function solveNumeric(f) {
  const lo = -9, hi = 12, steps = 2100;
  let prevX = 10 ** lo, prevF = f(prevX);
  for (let i = 1; i <= steps; i++) {
    const x = 10 ** (lo + (hi - lo) * i / steps);
    const fx = f(x);
    if (Number.isFinite(prevF) && Number.isFinite(fx) && Math.sign(fx) !== Math.sign(prevF)) {
      return bisect(f, prevX, x, prevF);
    }
    prevX = x; prevF = fx;
  }
  return NaN;
}

function bisect(f, a, b, fa) {
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2, fm = f(m);
    if (fm === 0 || (b - a) / Math.abs(m) < 1e-15) return m;
    if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else { b = m; }
  }
  return (a + b) / 2;
}
