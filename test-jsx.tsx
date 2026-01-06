const test = (
  {(() => {
    const segments = [];
    if (!true) {
      return <div>empty</div>;
    }
    return (
      <div>
        {segments.map((segment) => {
          return <div>{segment}</div>;
        })}
      </div>
    );
  })()}
);
