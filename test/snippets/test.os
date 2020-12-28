/// call expression with one argument (script)
// single-line comment
/*
 * multi-line comment
 */
#ifdef TEST
  invalid '
#else
  function nodebug Test(Dynamic arg1, arg2, ...)
    return arg1 ? arg2 : false;
  end
#endif
